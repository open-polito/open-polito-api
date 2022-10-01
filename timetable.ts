import { Device } from "./device";
import { checkError } from "./utils";
import { parse as parseDate } from "date-format-parse";

/** A slot for a lesson */
export type TimetableSlot = {
    /** The start time for the slot, as Unix epoch */
    start_time: number
    end_time: number
    /** @example "Lezione/Esercitazione" */
    type: string
    course_name: string
    professor: {
        name: string
        surname: string
    }
    /** @example "R1b" */
    room: string
    /** @example "https://www.polito.it/ateneo/sedi/?bl_id=TO_CIT06&fl_id=XP01&rm_id=006" */
    room_url: string
};

export async function getTimetable(device: Device, date: Date = new Date()): Promise<TimetableSlot[]> {
	const data = await device.post("orari_lezioni.php", { data_rif: (100 + date.getDate()).toString().substring(1) + "/" + (101 + date.getMonth()).toString().substring(1) + "/" + date.getFullYear() });
	checkError(data);
	if (data.data.orari === "") // the API returns "" when there are no lessons
		return [];
	return data.data.orari.map(o => ({
		start_time: parseDate(o.ORA_INIZIO, "DD/MM/YYYY hh:mm:ss").getTime(),
		end_time: parseDate(o.ORA_FINE, "DD/MM/YYYY hh:mm:ss").getTime(),
		type: o.TIPOLOGIA_EVENTO,
		course_name: o.TITOLO_MATERIA,
		professor: {
			name: o.NOME,
			surname: o.COGNOME,
		},
		room: o.AULA,
		room_url: o.URL_MAPPA_AULA,
	}) as TimetableSlot);
}
