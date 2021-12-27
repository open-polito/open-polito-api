import { Device } from ".";
import { checkError } from "./utils";
import { parse as parseDate } from "date-format-parse";

type ExamSession = {
    session_id: number
    exam_id: string // 01URPOV
    exam_name: string // 'Machine learning for vision and multimedia (AA-ZZ)'
    date: Date
    room: string
    type: string // 'Scritto e Orale'
    error_msg: string // An error message if the user can't sign up for the session. Empty otherwise.
    signup_deadline: Date
};

export async function getExamSessions(device: Device): Promise<ExamSession[]> {
    const data = await device.post("esami.php", { operazione: "LISTA" });
    checkError(data);
    console.log(data.data.esami.data);
    return data.data.esami.data.map(e => ({
        session_id: e.ID_VERBALE,
        exam_id: e.COD_INS_STUDENTE,
        exam_name: e.NOME_INS,
        date: parseDate(e.DATA_APPELLO + ' ' + e.ORA_APPELLO, "DD/MM/YYYY hh:mm"),
        room: e.AULA,
        type: e.DESC_TIPO,
        error_msg: (e.DESCR_MSG == "CONTROLLO SUPERATO") ? "" : e.DESCR_MSG,
        signup_deadline: parseDate(e.SCADENZA, "DD/MM/YYYY hh:mm"),
    }) as ExamSession)
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