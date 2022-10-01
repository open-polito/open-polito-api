import { Device } from "./device";
import { checkError } from "./utils";
import { parse as parseDate } from "date-format-parse";
import { MaterialItem, parseMaterial } from "./material";

/** A recording of a lesson (either in-class or over Zoom/BBB) */
export type Recording = {
	title: string
	/** Date of recording in Unix epoch */
	date: number
	url: string
	/** A link to a cover image */
	cover_url: string
	/** Length in minutes */
	length: number
}

function parseVCRecording(item: any): Recording {
	const duration_parts = item.duration.match(/^(\d+)h (\d+)m$/);
	let duration = 0;
	if (duration_parts !== null)
		duration = 60 * parseInt(duration_parts[1]) + parseInt(duration_parts[2]);
	return {
		title: item.titolo,
		date: parseDate(item.data, "DD/MM/YYYY hh:mm").getTime(),
		url: item.video_url,
		cover_url: item.cover_url,
		length: duration
	};
}

/** A live lesson being streamed over Zoom/BBB */
export type LiveLesson = {
	title: string;
	id_incarico: number;
	meeting_id: string;
	/** The starting date as Unix epoch */
	date: number;
}

/**
 * @param device
 * @param lesson
 * @returns An object containing:
 *  - url: a link to the Zoom interface
 *  - running: false if the meeting has been created but not started
 */
export async function getLessonURL(device: Device, lesson: LiveLesson): Promise<{
	url: string,
	running: boolean,
}> {
	const data = await device.post("goto_virtualclassroom.php", { id_inc: lesson.id_incarico, meetingid: lesson.meeting_id });
	checkError(data);
	return {
		running: data.data.isrunning,
		url: data.data.url,
	};
}

export type BasicCourseInfo = {
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

export type CourseInfo = {
	/** The calendar year when this course finishes */
	calendar_year: string
	/**
	 * The year in the degree when this course takes place
	 * 
	 * @remarks
	 * 
	 * The value 1 represents the first year of both BSc and MSc courses.
	 */
	degree_year: number
	/** The teaching period (it: periodo didattico) when this course takes place (1 or 2, or null if this field is not relevant) */
	year_period: number | null
	professor: {
		name: string,
		surname: string
	}
	notices: Notice[]
	material: MaterialItem[]
	/** One or more live lessons that are being streamed */
	live_lessons: LiveLesson[]
	/** Recordings of in-class lessons (it: videolezioni) */
	recordings: Recording[]
	/** Recordings of BBB/Zoom lessons (it: virtual classroom) */
	vc_recordings: {
		current: Recording[],
		[year: number]: Recording[]
	}
	/** Extended, human-readable information about the course */
	info: CourseInfoParagraph[]
}

/**
 * Returns whether the course is fictitious (thesis, internship, etc.)
 *
 * @param course
 */
export function is_dummy(course: BasicCourseInfo): boolean {
	return course.category === "T" || course.category === "A";
}

/**
 * Fetches information about a course obtained from {@link getCoursesInfo}.
 *
 * @param device
 * @param course
 */
export async function getExtendedCourseInfo(device: Device, course: BasicCourseInfo): Promise<CourseInfo> {
	const data = await device.post("materia_dettaglio.php",
		course.id_incarico === null
			? { cod_ins: course.code }
			: { incarico: course.id_incarico });
	checkError(data);

	// The string may be either "1" (eg. year-long extra courses) or "1-1".
	const year_parts = data.data.info_corso.periodo.split("-");
	if (year_parts.length > 2)
		throw new Error(`Unexpected value for info_corso.periodo: "${data.data.info_corso.periodo}"`);
	const ret: CourseInfo = {
		degree_year: year_parts[0],
		year_period: (year_parts.length > 1) ? year_parts[1] : null,
		calendar_year: data.data.info_corso.a_acc,
		professor: {
			name: data.data.info_corso.nome_doce,
			surname: data.data.info_corso.cognome_doce
		},
		notices: data.data.avvisi?.map(a => ({
			date: parseDate(a.data_inizio, "DD/MM/YYYY").getTime(),
			text: a.info,
		}) as Notice) || [],
		material: data.data.materiale?.map(item => parseMaterial(item)) || [],
		live_lessons: data.data.virtualclassroom?.live.map(vc => ({
			title: vc.titolo,
			id_incarico: vc.id_inc,
			meeting_id: vc.meetingid,
			date: parseDate(vc.data, "DD/MM/YYYY hh:mm").getTime(),
		} as LiveLesson)) || [],
		recordings: data.data.videolezioni?.lista_videolezioni?.map(item => {
			const duration_parts = item.duration.match(/^(\d+)h (\d+)m$/);
			const duration = 60 * parseInt(duration_parts[1]) + parseInt(duration_parts[2]);
			return {
				title: item.titolo,
				date: parseDate(item.data, item.data.includes(":") ? "DD/MM/YYYY hh:mm" : "DD/MM/YYYY").getTime(),
				url: item.video_url,
				cover_url: item.cover_url,
				length: duration,
			} as Recording;
		}) || [],
		vc_recordings: {
			current: data.data.virtualclassroom?.registrazioni.map(item => parseVCRecording(item)) || []
		},
		info: Array.isArray(data.data.guida) ?
			data.data.guida?.map(p => ({
				title: p.titolo.replace(course.name, ""),
				text: p.testo,
			}) as CourseInfoParagraph) : [],
	};
	for (const recordings of data.data.virtualclassroom?.vc_altri_anni || [])
		ret.vc_recordings[recordings.anno] = recordings.vc.map(item => parseVCRecording(item));
	return ret;
}
