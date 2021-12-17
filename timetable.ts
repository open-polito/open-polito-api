import Device from "./device";
import { checkError } from "./utils";
import { parse as parseDate } from "date-format-parse";

type TimetableSlot = {
    start_time: Date // '15/12/2021 13:00:00'
    end_time: Date
    type: string // 'Lezione/Esercitazione'
    subject_title: string
    professor: {
        name: string
        surname: string
    }
    room: string // 'R1b'
    room_url: string // 'https://www.polito.it/ateneo/sedi/?bl_id=TO_CIT06&fl_id=XP01&rm_id=006'
};

export async function getTimetable(device: Device, date: Date = new Date()): Promise<TimetableSlot[]> {
    const data = await device.post("orari_lezioni.php", { data_rif: (100 + date.getDate()).toString().substring(1) + "/" + (101 + date.getMonth()).toString().substring(1) + "/" + date.getFullYear() });
    checkError(data);
    return data.data.orari.map(o => ({
        start_time: parseDate(o.ORA_INIZIO, "DD/MM/YYYY hh:mm:ss"),
        end_time: parseDate(o.ORA_FINE, "DD/MM/YYYY hh:mm:ss"),
        type: o.TIPOLOGIA_EVENTO,
        subject_title: o.TITOLO_MATERIA,
        professor: {
            name: o.NOME,
            surname: o.COGNOME,
        },
        room: o.AULA,
        room_url: o.URL_MAPPA_AULA,
    }) as TimetableSlot);
}