import { BasicCourseInfo } from "./course.js";
import { parse as parseDate } from "date-format-parse";
import { checkError } from "./utils.js";
import { Device } from "./device.js";

export type PermanentMark = {
	name: string,
	num_credits: number,
	mark: string,
	/** The date of the exam as Unix epoch */
	date: number,
}

export type ProvisionalMark = {
	name: string,
	mark: string | null,
	/** The date of the exam as Unix epoch */
	date: number,
	failed: boolean,
	absent: boolean,
	/**
	 * @remarks
	 * 
	 * Refer to {@link https://didattica.polito.it/img/RE_stati.jpg | the graph on Portale della Didattica} for information about the statuses.
	 */
	status: "P" | "C" | "R" | "V",
	professor_id: string,
	message: string,
};

export type CoursesInfo = {
	marks: {
		/** A permanent record of exam marks (it: libretto) */
		permanent: PermanentMark[],
		/** A list of marks that are yet to be permanently recorded (it: valutazioni provvisorie) */
		provisional: ProvisionalMark[],
	},
	/** A list of courses that are in this year's plan (it: carico didattico) */
	course_plan: {
		standard: BasicCourseInfo[],
		extra: BasicCourseInfo[],
	},
};

export async function getCoursesInfo(device: Device): Promise<CoursesInfo> {
	const vote_data = await device.post("studente.php", {});
	checkError(vote_data);
	const provisional_data = await device.post("valutazioni.php", {});
	checkError(provisional_data);

	return {
		marks: {
			permanent: vote_data.data.libretto.map(s => ({
				name: s.nome_ins,
				num_credits: s.n_cfe,
				mark: s.desc_voto,
				date: parseDate(s.d_esame, "DD/MM/YYYY").getTime(),
			} as PermanentMark)),
			provisional: provisional_data.data.valutazioni_provvisorie.map(v => ({
				name: v.NOME_INS,
				mark: v.VOTO_ESAME,
				date: parseDate(v.DATA_ESAME, "DD-MM-YYYY").getTime(),
				failed: v.FALLITO == "S",
				absent: v.ASSENTE == "S",
				status: v.STATO,
				professor_id: v.MAT_DOCENTE,
				message: v.T_MESSAGGIO,
			} as ProvisionalMark)),
		},
		course_plan: {
			standard: vote_data.data.carico_didattico.map(c => ({
				name: c.nome_ins,
				code: c.cod_ins,
				num_credits: c.n_cfe,
				task_id: c.id_inc_1,
				category: c.categoria,
				overbooking: c.overbooking !== "N",
			}) as BasicCourseInfo),
			extra: Object.keys(vote_data.data.altri_corsi)
				.map(year => vote_data.data.altri_corsi[year])
				.map(c => ({
					name: c.nome_ins_1,
					code: c.cod_ins,
					num_credits: c.n_cfe,
					task_id: c.id_inc_1,
					overbooking: false,
				}) as BasicCourseInfo) || [],
		},
	};
}