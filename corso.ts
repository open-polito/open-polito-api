import { Device } from "./device";
import { checkError } from "./utils";
import { parse as parseDate } from "date-format-parse"

export type File = {
    tipo: "file"
    code: string
    filename: string // Nome interno del file
    nome: string     // Nome da presentare all'utente
    mime_type: string
    size_kb: number
    data_inserimento: Date
}

export type Cartella = {
    tipo: "cartella"
    code: string
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
                data_inserimento: parseDate(item.data_ins, "YYYY/MM/DD hh:mm:ss")
            } as File;
        case "DIR":
            return {
                tipo: "cartella",
                code: item.code,
                nome: item.descrizione,
                file: item.files.map(it => parseMateriale(it))
            } as Cartella;
        default:
            throw new Error("Unknown file type " + item.tipo);
    }
}

export type Videolezione = {
    titolo: string
    data: Date
    url: string
    cover_url: string
    durata: number // In minuti
}

export type VirtualClassroomRecording = Videolezione

function parseRecording(item: any): VirtualClassroomRecording {
    const duration_parts = item.duration.match(/^(\d+)h (\d+)m$/);
    let duration = -1;
    if (duration_parts !== null)
        duration = 60 * parseInt(duration_parts[1]) + parseInt(duration_parts[2]);
    return {
        titolo: item.titolo,
        data: parseDate(item.data, "DD/MM/YYYY hh:mm"),
        url: item.video_url,
        cover_url: item.cover_url,
        durata: duration
    } as VirtualClassroomRecording;
}

export class LiveVCLesson {
    id_inc: number;
    meeting_id: string;
    title: string;
    date: Date;
    url: string;
    running: boolean;

    constructor(id_inc: number, meeting_id: string, title: string, date: string) {
        this.id_inc = id_inc;
        this.meeting_id = meeting_id;
        this.title = title;
        this.date = parseDate(date, "DD/MM/YYYY hh:mm");
    }

    // Sets .url and .running
    async populate(device: Device) {
        const data = await device.post("goto_virtualclassroom.php", { id_inc: this.id_inc, meetingid: this.meeting_id });
        checkError(data);
        this.running = data.data.isrunning;
        this.url = data.data.url;
        // this.url = `https://didattica.polito.it/pls/portal30/sviluppo.bbb_corsi.joinVirtualClassStudente?p_id_inc=${this.id_inc}&p_meeting_id=${this.meeting_id}`;
    }
}

// Returns a download URL.
export async function download(device: Device, file: File | Number): Promise<string> {
    let code;
    if (typeof file == "object") {
        code = (file as File).code;
    } else {
        code = file;
    }
    const data = await device.post("download.php", { code })
    checkError(data);
    return data.data.directurl;
}

export type BasicCourseInformation = {
    name: string
    code: string
    num_credits: number
    id_incarico: number | null
    category?: string
    overbooking: boolean
}

export type CourseInfoParagraph = {
    title: string
    text: string
}

/** A notice issued by a professor. */
export type Notice = {
    id: number
    /** Date of publication as Unix timestamp */
    date: number
    /** The notice text as raw HTML */
    text: string
}

export type CourseInformation = {
    /** The calendar year when this course finishes */
    calendar_year: string
    /** The year in the degree when this course takes place
     * 
     * @remarks
     * 
     * The value 1 represents the first year of both BSc and MSc courses.
     */
    degree_year: number
    /** The teaching period (it: periodo didattico) when this course takes place (1 or 2) */
    year_period: number
    professor_name: string
    professor_surname: string
    notices: Notice[]
    material: (File | Cartella)[]
    /** One or more live lessons that are being streamed */
    live_lessons: LiveVCLesson[]
    /** Recordings of in-class lessons (it: videolezioni) */
    recordings: Videolezione[]
    /** Recordings of BBB/Zoom lessons (it: virtual classroom) */
    vc_recordings: {
        current: VirtualClassroomRecording[],
        [year: number]: VirtualClassroomRecording[]
    }
    /** Extended, human-readable information about the course */
    info: CourseInfoParagraph[]
}

/** Returns whether the course is fictitious (thesis, internship, etc.) */
export function is_dummy(course: BasicCourseInformation): boolean {
    return course.category === "T" || course.category === "A";
}

/** Fetches information about a course obtained from {@link getBasicInfo}. */
export async function getExtendedCourseInformation(device: Device, course: BasicCourseInformation): Promise<CourseInformation> {
    const data = await device.post("materia_dettaglio.php",
        course.id_incarico === null
            ? { cod_ins: course.code }
            : { incarico: course.id_incarico });
    checkError(data);

    const year_parts = data.info_corso.periodo.split("-");
    if (year_parts.length != 2)
        throw new Error(`Unexpected value for info_corso.periodo: "${data.info_corso.periodo}"`);
    const ret: CourseInformation = {
        degree_year: year_parts[0],
        year_period: year_parts[1],
        calendar_year: data.data.info_corso.a_acc,
        professor_name: data.data.info_corso.nome_doce,
        professor_surname: data.data.info_corso.cognome_doce,
        notices: data.data.avvisi?.map(a => ({
            date: parseDate(a.data_inizio, "DD/MM/YYYY").getTime(),
            text: a.info,
        }) as Notice) || [],
        material: data.data.materiale?.map(item => parseMateriale(item)) || [],
        live_lessons: data.data.virtualclassroom?.live.map(vc => new LiveVCLesson(vc.id_inc, vc.meetingid, vc.titolo, vc.data)) || [],
        recordings: data.data.videolezioni?.lista_videolezioni?.map(item => {
            const duration_parts = item.duration.match(/^(\d+)h (\d+)m$/)
            const duration = 60 * parseInt(duration_parts[1]) + parseInt(duration_parts[2])
            return {
                titolo: item.titolo,
                data: parseDate(item.data, item.data.includes(":") ? "DD/MM/YYYY hh:mm" : "DD/MM/YYYY"),
                url: item.video_url,
                cover_url: item.cover_url,
                durata: duration,
            } as Videolezione
        }) || [],
        vc_recordings: {
            current: data.data.virtualclassroom?.registrazioni.map(item => parseRecording(item)) || []
        },
        info: Array.isArray(data.data.guida) ?
            data.data.guida?.map(p => ({
                title: p.titolo.replace(course.name, ""),
                text: p.testo,
            }) as CourseInfoParagraph) : [],
    };
    for (const recordings of data.data.virtualclassroom?.vc_altri_anni || [])
        ret.vc_recordings[recordings.anno] = recordings.vc.map(item => parseRecording(item));
    return ret;
}
