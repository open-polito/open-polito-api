import { Device } from "./device.js";
import { checkError } from "./utils.js"
import { parse as parseDate } from "date-format-parse"

export type Notification = {
    id: number
    title: string
    body: string | null
    /** The category of this notification (eg. official reminder, professor notice, etc) */
    topic: string
    /** The time when this notification was created, as Unix epoch */
    time: number
    /** Whether the user read this notification from the official app or via {@link markNotificationRead} */
    is_read: boolean
}

export type TestNotification = Notification & { topic: "test" }
export type DirectNotification = Notification & { topic: "individuale" } // CPD, annullare le prenotazioni, etc
export type NoticeNotification = Notification & { topic: "avvisidoc"; course: number; } // "course" refers to id_incarico
export type MaterialNotification = Notification & { topic: "matdid"; course: number; }

export async function getNotifications(device: Device): Promise<Notification[]> {
    const data = await device.post("messaggi.php", { operazione: "list" });
    checkError(data);
    return data.data.messaggi.map(m => {
        let ret: Notification = {
            id: m.id,
            title: m.title,
            body: m.msg,
            topic: m.transazione,
            time: parseDate(m.time_proc, "YYYY/MM/DD hh:mm:ss").getTime(),
            is_read: m.is_read,
        }
        if (ret.topic == "avvisidoc" || ret.topic == "matdid") {
            (ret as NoticeNotification).course = m.attr_notifica.inc;
        }
        return ret;
    });
}

export async function markNotificationRead(device: Device, id: number): Promise<void> {
    const data = await device.post("messaggi.php", { operazione: "read", msgid: id });
    checkError(data);
}

export async function deleteNotification(device: Device, id: number): Promise<void> {
    const data = await device.post("messaggi.php", { operazione: "del", msgid: id });
    checkError(data);
}