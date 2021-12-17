import Device from "./device";
import { checkError } from "./utils";

type TimetableSlot = {
    start_time: string // '15/12/2021 13:00:00'
    end_time: string
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
        start_time: o.ORA_INIZIO,
        end_time: o.ORA_FINE,
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