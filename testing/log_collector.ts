import { getContexts, getSlots } from "../booking";
import { getExtendedCourseInformation } from "../course";
import { Device } from "../device";
import { getExamSessions } from "../exam_sessions";
import { getDownloadURL } from "../material";
import { getTimetable } from "../timetable";
import { getUnreadMail, User } from "../user";

const username = "S123456";
const password = "password";

const log_entries: { endpoint: string, request: string, response: string }[] = [];
const logger = entry => { console.log(entry); log_entries.push(entry); }
const device = new Device("ea27a150-39d5-4f6a-ae1e-51f38bfe0039", 3000, logger);

(async () => {
    await device.register();
    await device.loginWithCredentials(username, password);
    const user = new User(device);
    await user.populate();
    await getExamSessions(device);
    await getUnreadMail(device);
    await getTimetable(device);
    await Promise.all(user.carico_didattico.corsi.map(corso => getExtendedCourseInformation(device, corso)));
    await getDownloadURL(device, 33278489);
    await user.updateBookings();
    await getContexts(user.device);
    await getSlots(user.device, "AULE_STUDIO", "AS_LINGOTTO_2", new Date("2021-12-21T12:03:04.564Z"));
    require("fs").writeFileSync("log.json", JSON.stringify(log_entries, null, 2));
})();