import { Device } from ".";
import { checkError } from "./utils";
import { parse as parseDate } from "date-format-parse";

type ExamSession = {
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
        exam_id: e.COD_INS_STUDENTE,
        exam_name: e.NOME_INS,
        date: parseDate(e.DATA_APPELLO + ' ' + e.ORA_APPELLO, "DD/MM/YYYY hh:mm"),
        room: e.AULA,
        type: e.DESC_TIPO,
        error_msg: (e.DESCR_MSG == "CONTROLLO SUPERATO") ? "" : e.DESCR_MSG,
        signup_deadline: parseDate(e.SCADENZA, "DD/MM/YYYY hh:mm"),
    }) as ExamSession)
}