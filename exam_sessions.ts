import { Device } from "./device";
import { checkError } from "./utils";
import { parse as parseDate } from "date-format-parse";

/** A session on which an exam can be sat */
export type ExamSession = {
    /** A unique ID for this session */
    session_id: number
    /** @example "01URPOV" */
    course_id: string
    /** Unknown */
    signup_id: number
    /** @example "Machine learning for vision and multimedia (AA-ZZ)" */
    exam_name: string
    user_is_signed_up: boolean
    /** The date when this session will take place, as Unix epoch */
    date: number
    rooms: string[]
    /** @example "Scritto e Orale" */
    type: string
    error: {
        id: number
        ita: string
        eng: string
    }
    /** An error message if the user can't sign up for the session. Empty otherwise */
    error_msg: string
    /** The deadline for signing up for this session, as Unix epoch */
    signup_deadline: number
};

// Returns exam sessions starting with the closest one.
export async function getExamSessions(device: Device): Promise<ExamSession[]> {
    const data = await device.post("esami.php", { operazione: "LISTA" });
    checkError(data);
    return data.data.esami.data.map(e => ({
        session_id: e.ID_VERBALE,
        course_id: e.COD_INS_STUDENTE,
        signup_id: e.ID,
        exam_name: e.NOME_INS,
        user_is_signed_up: e.ID != -1,
        date: parseDate(e.DATA_APPELLO + ' ' + e.ORA_APPELLO, "DD/MM/YYYY hh:mm").getTime(),
        rooms: e.AULA.split("; "),
        type: e.DESC_TIPO,
        error: {
            id: e.ID_MSG, // 0 = ok; -237 = the user already booked this exam
            ita: (e.ID_MSG == 0 || e.ID != -1) ? "" : e.DESCR_MSG,
            eng: (e.ID_MSG == 0 || e.ID != -1) ? "" : e.DESCR_MSG_ENG,
        },
        signup_deadline: parseDate(e.SCADENZA, "DD/MM/YYYY hh:mm").getTime(),
    }) as ExamSession).sort((a, b) => a.date - b.date);
}

// Returns an exam session ID that is currently unused.
export async function bookExamSession(device: Device, session_id: number, exam_id: string): Promise<number> {
    const data = await device.post("esami.php", { operazione: "PRENOTA", cod_ins: exam_id, id_verbale: session_id });
    checkError(data);
    return data.data.esami.id;
}

export async function cancelExamSession(device: Device, session_id: number, exam_id: string) {
    const data = await device.post("esami.php", { operazione: "ANNULLA", cod_ins: exam_id, id_verbale: session_id });
    checkError(data);
}