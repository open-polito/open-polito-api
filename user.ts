import { checkError } from "./utils.js";
import { EsameProvvisorio, EsameSostenuto, Libretto } from "./libretto.js";
import Corso from "./corso.js";
import { CaricoDidattico } from "./carico_didattico.js";
import Device from "./device";
import { Booking, getBookings } from "./booking.js";
import { parse as parseDate } from "date-format-parse";

export type Anagrafica = {
    matricola: string, // Es. "123456",
    matricole: string[], // La lista di matricole (es. triennale+magistrale)
    nome: string, // "Mario"
    cognome: string, // "ROSSI"
    tipo_corso_laurea: string, // "Corso di Laurea in"
    nome_corso_laurea: string, // "INGEGNERIA INFORMATICA"
}

export default class User {
    device: Device
    anagrafica: Anagrafica
    libretto!: Libretto;
    carico_didattico!: CaricoDidattico
    bookings: Booking[]

    constructor(device: Device, anagrafica: Anagrafica) {
        this.device = device;
        this.anagrafica = anagrafica;
        this.bookings = [];
    }

    // Aggiorna libretto, valutazioni provvisorie e carico didattico
    async populate() {
        const vote_data = await this.device.post("studente.php", {});
        checkError(vote_data);
        this.libretto = new Libretto();
        this.libretto.materie = vote_data.data.libretto.map(s => ({
            nome: s.nome_ins,
            cfu: s.n_cfe,
            voto: s.desc_voto,
            data: parseDate(s.d_esame, "DD/MM/YYYY"),
            stato: s.esplica_efi,
        } as EsameSostenuto));
        this.carico_didattico = new CaricoDidattico();
        const standard_courses = vote_data.data.carico_didattico;
        let extra_courses: any[] = [];
        for (const year in vote_data.data.altri_corsi)
            extra_courses = extra_courses.concat(vote_data.data.altri_corsi[year]);
        this.carico_didattico.corsi = standard_courses.map(c => new Corso(
            this.device, c.nome_ins, c.cod_ins, c.n_cfe, c.id_inc_1, c.categoria, c.overbooking != "N", false
        )).concat(extra_courses.map(c => new Corso(
            this.device, c.nome_ins, c.cod_ins, c.n_cfe, c.id_inc_1, c.categoria, c.overbooking != "N", true
        )) || []);

        const prov_data = await this.device.post("valutazioni.php", {});
        checkError(prov_data);
        this.libretto.provvisori = prov_data.data.valutazioni_provvisorie.map(v => ({
            nome: v.NOME_INS,
            voto: v.VOTO_ESAME,
            fallito: v.FALLITO == "S",
            assente: v.ASSENTE == "S",
            stato: v.STATO,
            docente: v.MAT_DOCENTE,
            messaggio: v.T_MESSAGGIO,
        } as EsameProvvisorio));
    }

    // Aggiorna prenotazioni
    async updateBookings() {
        this.bookings = await getBookings(this.device);
    }

    // Numero di mail totali e non lette
    async unreadMail(): Promise<{
        total: number,
        unread: number
    }> {
        const data = await this.device.post("mail.php", {});
        // Todo: mappare gli esiti fallimentari
        checkError(data);

        return {
            total: data.data.mail.messages,
            unread: data.data.mail.unread,
        };
    }

    async emailUrl(): Promise<string> {
        const data = await this.device.post("goto_webmail.php", {});
        checkError(data);
        return data.data.url;
    }
}