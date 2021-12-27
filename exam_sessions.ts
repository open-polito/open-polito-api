import { Device } from ".";
import { checkError } from "./utils.js";
import { parse as parseDate } from "date-format-parse";

type ExamSession = {
    session_id: number
    exam_id: string // 01URPOV
    signup_id: number // Unknown value
    exam_name: string // 'Machine learning for vision and multimedia (AA-ZZ)'
    user_is_signed_up: boolean
    date: Date
    rooms: string[]
    type: string // 'Scritto e Orale'
    error: {
        id: number
        ita: string
        eng: string
    }
    error_msg: string // An error message if the user can't sign up for the session. Empty otherwise.
    signup_deadline: Date
};

// Returns exam sessions starting with the closest one.
export async function getExamSessions(device: Device): Promise<ExamSession[]> {
    const data = await device.post("esami.php", { operazione: "LISTA" });
    checkError(data);
    return data.data.esami.data.map(e => ({
        session_id: e.ID_VERBALE,
        exam_id: e.COD_INS_STUDENTE,
        signup_id: e.ID,
        exam_name: e.NOME_INS,
        user_is_signed_up: e.ID != -1,
        date: parseDate(e.DATA_APPELLO + ' ' + e.ORA_APPELLO, "DD/MM/YYYY hh:mm"),
        rooms: e.AULA.split("; "),
        type: e.DESC_TIPO,
        error: {
            id: e.ID_MSG, // 0 = ok; -237 = the user already booked this exam
            ita: (e.ID_MSG == 0 || e.ID != -1) ? "" : e.DESCR_MSG,
            eng: (e.ID_MSG == 0 || e.ID != -1) ? "" : e.DESCR_MSG_ENG,
        },
        signup_deadline: parseDate(e.SCADENZA, "DD/MM/YYYY hh:mm"),
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