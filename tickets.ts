import { Device } from "./device.js";
import { checkError } from "./utils.js";

/**
 * A support ticket.
 */
export type Ticket = {
    id: number
    title: string
    /**
     * The HTML text of the first message
     */
    description: string
    /**
     * The date when this ticket was opened, as Unix epoch
     */
    creation_date: number
    /**
     * The date when this ticket was last updated, as Unix epoch
     */
    last_updated: number
    /**
     * A number representing the state of the ticket. 1 = open, 2 = closed
     */
    state: number
    /**
     * The number of unread messages in the ticket thread
     */
    unread: number
}

function parseTicket(data: any): Ticket {
    return {
        id: data.id,
        title: data.oggetto,
        description: data.descrizione,
        creation_date: data.dataApertura,
        last_updated: data.dataAggiornamento,
        state: data.idStato,
        unread: data.countnonlette,
    };
}

/**
 * @returns The list of tickets for the user.
 */
export async function getTickets(device: Device): Promise<Ticket[]> {
    const data = await device.post("ticket.php", { operazione: "getListaTicket" });
    checkError(data);
    return data.data.ticket.map(item => parseTicket(item));
}

/**
 * @returns Details about the given ticket.
 */
export async function getTicket(device: Device, ticket_id: number): Promise<Ticket> {
    const data = await device.post("ticket.php", { operazione: "getTicket", id_ticket: ticket_id });
    checkError(data);
    return parseTicket(data.data.ticket);
}

/**
 * Posts a message in a ticket thread.
 * 
 * @param device
 * @param ticket_id The ID of the ticket
 * @param text The HTML text of the reply (must use <br> for newlines)
 */
export async function replyToTicket(device: Device, ticket_id: number, text: string): Promise<void> {
    const data = await device.post("ticket.php", { operazione: "sendRisposta", testo: text, id_ticket: ticket_id });
    checkError(data);
}