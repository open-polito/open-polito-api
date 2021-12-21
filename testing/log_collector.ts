import { getContexts, getSlots } from "../booking";
import Device from "../device";
import { getTimetable } from "../timetable";

const username = "S123456";
const password = "password";

const log_entries: { endpoint: string, request: string, response: string }[] = [];
const logger = entry => { console.log(entry); log_entries.push(entry); }
const device = new Device("ea27a150-39d5-4f6a-ae1e-51f38bfe0039", logger);

(async () => {
    await device.register();
    const { user, token } = await device.loginWithCredentials(username, password);
    await user.populate();
    await user.unreadMail();
    await getTimetable(device);
    await Promise.all(user.carico_didattico.corsi.map(corso => corso.populate()));
    await user.carico_didattico.corsi[2].download(33278489);
    await user.updateBookings();
    await getContexts(user.device);
    await getSlots(user.device, "AULE_STUDIO", "AS_LINGOTTO_2", new Date("2021-12-21T12:03:04.564Z"));
    require("fs").writeFileSync("log.json", JSON.stringify(log_entries, null, 2));
})();