import { checkError } from "./utils";
import { EsameProvvisorio, EsameSostenuto, Libretto } from "./libretto";
import { BasicCourseInformation } from "./corso";
import { CaricoDidattico } from "./carico_didattico";
import { Device } from "./device";
import { Booking, getBookings } from "./booking";
import { parse as parseDate } from "date-format-parse";

export type PersonalData = {
    /**
     * The current student ID (it: matricola)
     * 
     * @example 123456
     */
    current_id: string,
    /** Past and present student IDs */
    ids: string[],
    name: string,
    surname: string,
    /** The type of degree (BSc or MSc), in Italian
     * 
     * @example "Corso di Laurea in"
     */
    degree_type: string,
    /** The name of the degree, in Italian
     * 
     * @example "INGEGNERIA INFORMATICA"
    */
    degree_name: string,
}

export class User {
    device: Device
    libretto!: Libretto;
    carico_didattico!: CaricoDidattico
    bookings: Booking[]

    constructor(device: Device) {
        this.device = device;
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
        this.carico_didattico.corsi = standard_courses.map(c => ({
            name: c.nome_ins,
            code: c.cod_ins,
            num_credits: c.n_cfe,
            id_incarico: c.id_inc_1,
            category: c.categoria,
            overbooking: c.overbooking !== "N",
        }) as BasicCourseInformation);
        let extra_courses: any[] = [];
        for (const year in vote_data.data.altri_corsi)
            extra_courses = extra_courses.concat(vote_data.data.altri_corsi[year]);
        this.carico_didattico.extra_courses = extra_courses.map(c => ({
            name: c.nome_ins_1,
            code: c.cod_ins,
            num_credits: c.n_cfe,
            id_incarico: c.id_inc_1,
            overbooking: false,
        }) as BasicCourseInformation) || [];

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
}

/**
 * @returns The total number of emails and the number of unread ones.
 */
export async function getUnreadMail(device: Device): Promise<{total: number, unread: number}> {
    const data = await device.post("mail.php", {});
    checkError(data);

    return {
        total: data.data.mail.messages,
        unread: data.data.mail.unread,
    };
}

/**
 * @returns An URL to open the Web email client (different for each user).
 */
export async function emailUrl(device: Device): Promise<string> {
    const data = await device.post("goto_webmail.php", {});
    checkError(data);
    return data.data.url;
}