import Device from "./device";
import { checkError } from "./utils";

type Avviso = {
    id: number
    data_inizio: string
    data_fine: string
    info: string // In raw HTML
}

type File = {
    tipo: "file"
    code: string
    filename: string // Nome interno del file
    nome: string     // Nome da presentare all'utente
    mime_type: string
    size_kb: number
    data_inserimento: string
}

type Cartella = {
    tipo: "cartella"
    nome: string
    file: (File | Cartella)[]
}

function parseMateriale(item: any): File|Cartella {
    switch (item.tipo) {
        case "FILE":
            return {
                tipo: "file",
                code: item.code,
                filename: item.nomefile,
                nome: item.descrizione,
                mime_type: item.cont_type,
                size_kb: item.size_kb,
                data_inserimento: item.data_ins
            } as File;
        case "DIR":
            return {
                tipo: "cartella",
                nome: item.descrizione,
                file: item.files.map(it => parseMateriale(it))
            } as Cartella;
        default:
            throw new Error("Unknown file type " + item.tipo);
    }
}

type Videolezione = {
    titolo: string
    data: string
    url: string
    cover_url: string
    durata: number // In minuti
}

type CourseInfoParagraph = {
    title: string
    text: string
}

export default class Corso {
    device: Device
    nome: string
    codice: string
    cfu: number
    id_incarico: number | null
    categoria: string
    overbooking: boolean

    // Valori settati da populate()
    anno_accademico: string // a.a. di fine corso (es. 2021/22 avrà anno_accademico = 2022)
    anno_corso: number // anno del piano di studi cui si svolge il corso (es. un corso delle matricole, o del primo anno LM, avrà 1)
    periodo_corso: number // periodo didattico in cui si svolge il corso (1 o 2)
    nome_prof: string
    cognome_prof: string
    avvisi: Avviso[]
    materiale: (File | Cartella)[]
    videolezioni: Videolezione[]
    info: CourseInfoParagraph[]

    constructor(device: Device, nome: string, codice: string, cfu: number, id_incarico: number | null, categoria: string, overbooking: boolean) {
        this.device = device;
        this.nome = nome;
        this.codice = codice;
        this.cfu = cfu;
        this.id_incarico = id_incarico;
        this.categoria = categoria;
        this.overbooking = overbooking;
    }

    async populate() {
        const is_detailed = this.id_incarico !== null;
        let data;
        if (is_detailed)
            data = await this.device.post("materia_dettaglio.php", { incarico: this.id_incarico });
        else
            data = await this.device.post("materia_dettaglio.php", { cod_ins: this.codice });
        checkError(data);
        this.anno_accademico = data.data.info_corso.a_acc;
        const parts_anno = data.data.info_corso.periodo.split("-");
        if (parts_anno.length == 2) {
            this.anno_corso = parts_anno[0];
            this.periodo_corso = parts_anno[1];
        }
        this.nome_prof = data.data.info_corso.nome_doce;
        this.cognome_prof = data.data.info_corso.cognome_doce;
        this.avvisi = data.data.avvisi || [];
        this.materiale = data.data.materiale?.map(item => parseMateriale(item)) || [];
        this.videolezioni = data.data.videolezioni?.lista_videolezioni?.map(item => {
            const duration_parts = item.duration.match(/^(\d+)h (\d+)m$/);
            const duration = 60*parseInt(duration_parts[1]) + parseInt(duration_parts[2]);
            return {
                titolo: item.titolo,
                data: item.data,
                url: item.video_url,
                cover_url: item.cover_url,
                durata: duration
            } as Videolezione;
        }) || [];
        this.info = data.data.guida.map(p => ({
            title: p.titolo.replace(this.nome, ""),
            text: p.testo,
        }) as CourseInfoParagraph);
    }

    // Returns a download URL.
    async download(file: File | Number): Promise<string> {
        let code;
        if (typeof file == "object") {
            code = (file as File).code;
        } else {
            code = file;
        }
        const data = await this.device.post("download.php", { code })
        checkError(data);
        return data.data.directurl;
    }
}