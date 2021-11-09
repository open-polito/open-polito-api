import { checkError, post } from "./utils";
import { EsameProvvisorio, EsameSostenuto, Libretto } from "./libretto";
import Corso from "./corso";
import { CaricoDidattico } from "./carico_didattico";

export default class User {
    uuid: string;
    token: string;
    anagrafica: {
        matricola: string, // Es. "123456",
        matricole: string[], // La lista di matricole (es. triennale+magistrale)
        nome: string, // "Mario"
        cognome: string, // "ROSSI"
        tipo_corso_laurea: string, // "Corso di Laurea in"
        nome_corso_laurea: string, // "INGEGNERIA INFORMATICA"
    };
    libretto: Libretto;
    carico_didattico: CaricoDidattico;

    // Aggiorna libretto, valutazioni provvisorie e carico didattico
    async populate() {
        const vote_data = await post("studente.php", { regID: this.uuid, token: this.token });
        checkError(vote_data);
        this.libretto = new Libretto();
        this.libretto.materie = vote_data.data.libretto.map(s => ({
            nome: s.nome_ins,
            cfu: s.n_cfe,
            voto: s.desc_voto,
            data: s.d_esame,
            stato: s.esplica_efi,
        } as EsameSostenuto));
        this.carico_didattico = new CaricoDidattico();
        this.carico_didattico.corsi = vote_data.data.carico_didattico.map(c => new Corso(
            this.uuid, this.token, c.nome_ins, c.cod_ins, c.n_cfe, c.id_inc_1, c.categoria, c.overbooking == "N"
        ));

        const prov_data = await post("valutazioni.php", { regID: this.uuid, token: this.token });
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

    // Numero di mail totali e non lette
    async unreadMail(): Promise<{
        total: number,
        unread: number
    }> {
        const data = await post("mail.php", {regID: this.uuid, token: this.token});
        // Todo: mappare gli esiti fallimentari
        checkError(data);

        return {
            total: data.data.mail.messages,
            unread: data.data.mail.unread,
        };
    }
}