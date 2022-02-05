import { checkError } from "./utils.js";
import { Device } from "./device.js";

export type PersonalData = {
    /**
     * The current student ID (it: matricola)
     * 
     * @example 123456
     */
    current_id: string,
    /** Past and present student IDs */
    ids: string[],
    name: string,
    surname: string,
    /**
     * The type of degree (BSc or MSc), in Italian
     * 
     * @example "Corso di Laurea in"
     */
    degree_type: string,
    /**
     * The name of the degree, in Italian
     * 
     * @example "INGEGNERIA INFORMATICA"
     */
    degree_name: string,
}

/**
 * @param device
 * @returns The total number of emails and the number of unread ones.
 */
export async function getUnreadMail(device: Device): Promise<{total: number, unread: number}> {
	const data = await device.post("mail.php", {});
	checkError(data);

	return {
		total: data.data.mail.messages,
		unread: data.data.mail.unread,
	};
}

/**
 * @param device
 * @returns An URL to open the Web email client (different for each user).
 */
export async function emailUrl(device: Device): Promise<string> {
	const data = await device.post("goto_webmail.php", {});
	checkError(data);
	return data.data.url;
}