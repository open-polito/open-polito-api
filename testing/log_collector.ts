import { writeFileSync } from "fs";
import { getBookings, getContexts, getSlots } from "../booking";
import { getExtendedCourseInfo } from "../course";
import { getCoursesInfo } from "../courses";
import { Device } from "../device";
import { getExamSessions } from "../exam_sessions";
import { getDownloadURL } from "../material";
import { getTimetable } from "../timetable";
import { getUnreadMail } from "../user";

const username = "S123456";
const password = "password";

const log_entries: { endpoint: string, request: string, response: string }[] = [];
const logger = entry => { console.log(entry); log_entries.push(entry); };
const device = new Device("ea27a150-39d5-4f6a-ae1e-51f38bfe0039", 3000, logger);

(async () => {
	await device.register();
	await device.loginWithCredentials(username, password);
	const courses_info = await getCoursesInfo(device);
	await getExamSessions(device);
	await getUnreadMail(device);
	await getTimetable(device);
	await Promise.all(courses_info.course_plan.standard.map(course => getExtendedCourseInfo(device, course)));
	await getDownloadURL(device, 33278489);
	await getBookings(device);
	await getContexts(device);
	await getSlots(device, "AULE_STUDIO", "AS_LINGOTTO_2", new Date("2021-12-21T12:03:04.564Z"));
	writeFileSync("log.json", JSON.stringify(log_entries, null, 2));
})();