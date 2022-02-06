import { Device } from "./device.js";
import { checkError } from "./utils.js";
import { parse as parseDate } from "date-format-parse";

export enum NotificationType {
	/** A test notification */
	TEST = "test",
	/** A direct notification (eg. JCT/CPD, reminder to cancel bookings, etc.) */
	DIRECT = "individuale",
	/** A professor's notice from a course */
	NOTICE = "avvisidoc",
	/** A file upload from a course */
	MATERIAL = "matdid",
}

export type Notification = {
	id: number
	title: string
	body: string | null
	/** The category of this notification (eg. official reminder, professor notice, etc) */
	topic: NotificationType | string
	/** The time when this notification was created, as Unix epoch */
	time: number
	/** Whether the user read this notification from the official app or via {@link markNotificationRead} */
	is_read: boolean
}

export type TestNotification = Notification & { topic: NotificationType.TEST }
export type DirectNotification = Notification & { topic: NotificationType.DIRECT }
export type NoticeNotification = Notification & { topic: NotificationType.NOTICE; course: number; }
export type MaterialNotification = Notification & { topic: NotificationType.MATERIAL; course: number; }

export async function getNotifications(device: Device): Promise<Notification[]> {
	const data = await device.post("messaggi.php", { operazione: "list" });
	checkError(data);
	return data.data.messaggi.map(m => {
		const ret: Notification = {
			id: m.id,
			title: m.title,
			body: m.msg,
			topic: m.transazione,
			time: parseDate(m.time_proc, "YYYY/MM/DD hh:mm:ss").getTime(),
			is_read: m.is_read,
		};
		if (ret.topic == NotificationType.NOTICE || ret.topic == NotificationType.MATERIAL) {
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

/**
 * Registers the FCM ID with the server to start receiving notifications.
 * 
 * @param device
 * @param token The FCM token received after registering
 * @param project_id The FCM project ID (default: the project ID for the Polito app)
 */
export async function registerPushNotifications(device: Device, token: string, project_id = "700615026996"): Promise<void> {
	const data = await device.post("rid.php", {
		rid: token,
		operazione: "subscribe",
		sender: project_id,
		app_version: "2.2.8",
		app_build: 202089,
		device_version: device.version,
	});
	checkError(data);
}

export type PushNotification = {
	id: number;
	/** The category of this notification (eg. official reminder, professor notice, etc) */
	topic: NotificationType | string;
	title: string;
	text: string;
	/** The time when this notification was sent, as Unix epoch */
	time: number;
}

/**
 * Parses a FCM message.
 *
 * @param data
 * @returns A {@link PushNotification} to be displayed.
 */
export function parsePushNotification(data: any): PushNotification {
	return {
		id: Number(data.polito_id_notifica),
		topic: data.polito_transazione,
		title: data.title,
		text: data.message,
		time: parseDate(data.polito_time_accod, "YYYY-MM-DD hh:mm:ss").getTime(),
	};
}

/**
 * Asks the server to send a push notification with sample text.
 *
 * @param device
 */
export async function sendTestPushNotification(device: Device): Promise<void> {
	const data = await device.post("testnotifica.php", {});
	checkError(data);
}
