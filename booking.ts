import { Device } from "./device";
import { checkError } from "./utils";
import { parse as parseDate } from "date-format-parse"

export type BookingContextID = "AULE_STUDIO" | "LEZIONI" | string

/** A sub-category of things that can be booked */
export type BookingSubcontext = {
    id: BookingContextID
    ita: {
        name: string
        /** @example "Gentile Utente, per potersi prenotare è necessario [...] Dichiaro di aver preso visione dell’informativa sopra riportata" */
        privacy_notice: string
        /** @example "L'accesso in Ateneo è consentito soltanto se in possesso di [...]" */
        green_pass_notice: string
    }
    eng: {
        name: string
        privacy_notice: string
        green_pass_notice: string
    }
    /** The duration of a slot in minutes */
    slot_duration: number
    /** The time of day when this subcontext opens (eg. "8" for "Help desk" means the help desk opens at 8 am) in 24-hour format */
    open_time: number
    /** The time of day when this subcontext opens in 24-hour format */
    close_time: number
    /** How many slots can be booked per day */
    max_bookings_per_day: number
    has_seat_selection: boolean
}

/** A category of things that can be booked */
export type BookingContext = {
    id: string
    ita: {
        name: string
        description: string
    }
    eng: {
        name: string
        description: string
    }
    /** A list of sub-categories (possibly null, eg. for lessons) */
    subcontexts?: BookingSubcontext[]
}

/** A slot of time when a room may be booked (all times as Unix timestamps) */
export type BookingSlot = {
    slot_start: number
    slot_end: number
    bookable_from: number
    bookable_until: number
    bookable: boolean
    seatsTotal: number
    seatsTaken: number
}

export type Booking = {
    // Example values are reported for a booking for a study room
    /** @example "AULE_STUDIO" */
    context_id: BookingContextID
    /** @example "Prenotazione posti in sale studio" */
    context_name: string
    /** @example "AS_LINGOTTO_2" */
    subcontext_id: string
    /** @example "Lingotto - Sala studio Le Corbusier" */
    subcontext_name: string
    start_time: number
    end_time: number
    /** @example "01PECQW" (only for lessons) */
    course_id?: string
}

/** Returns a link to a barcode that may be scanned by Polito employees to access bookings */
export function barcode_url(username: string): string {
    return `https://didattica.polito.it/bc/barcode.php?barcode=${username}&width=500&height=200&format=gif`
}

/** Returns a list of bookings made by this user */
export async function getBookings(device: Device): Promise<Booking[]> {
    const bookings_data = await device.post("booking_api.php", { operazione: "getBookings" });
    checkError(bookings_data);
    return bookings_data.data.booking_api.data.map(b => {
        const ret: Booking = {
            context_id: b.id_ambito,
            context_name: b.descr_ambito,
            subcontext_id: b.id_subambito,
            subcontext_name: b.nome_subambito,
            start_time: new Date(b.d_ini_turno_ts).getTime(),
            end_time: new Date(b.d_fin_turno_ts).getTime(),
        };
        const matches = b.lezione.match(/<h3><b>([^<]+)<\/h3><\/b>/);
        if (matches != null) {
            const lesson = matches[1];
            const parts = lesson.split(" ");
            ret.course_id = parts[parts.length - 1];
        }
        return ret;
    });
}

/** Returns a list of booking contexts */
export async function getContexts(device: Device): Promise<BookingContext[]> {
    const bookings_data = await device.post("booking_api.php", { operazione: "getAmbiti" });
    checkError(bookings_data);
    return bookings_data.data.booking_api.ambiti.map(c => ({
        id: c.id,
        ita: {
            name: c.titolo_ita,
            description: c.descr_ita,
        },
        eng: {
            name: c.titolo_eng.trim(),
            description: c.descr_eng.trim(),
        },
        subcontexts: c.subambiti?.subambiti?.map(s => ({
            id: s.id,
            ita: {
                name: s.titolo_ita,
                privacy_notice: s.opt_tpl_privacy,
                green_pass_notice: s.opt_tpl_gp
            },
            eng: {
                name: s.titolo_eng.trim(),
                privacy_notice: s.opt_tpl_privacy,
                green_pass_notice: s.opt_tpl_gp
            }
        }) as BookingSubcontext),
    }) as BookingContext);
}

export async function getSlots(device: Device, context_id: string, subcontext_id?: string, date: Date = new Date()): Promise<BookingSlot[]> {
    let input: any = {
        operazione: "getTurni",
        ambito: context_id,
        from: date.getTime(), to: date.getTime() + 1000 * 3600 * 24
    }
    if (subcontext_id)
        input.subambito = subcontext_id
    const bookings_data = await device.post("booking_api.php", input);
    checkError(bookings_data);
    return bookings_data.data.booking_api.turni.map(t => ({
        slot_start: parseDate(t.d_ini, "DD/MM/YYYY hh:mm").getTime(),
        slot_end: parseDate(t.d_fin, "DD/MM/YYYY hh:mm").getTime(),
        bookable_from: new Date(t.d_ini_preno_ts).getTime(),
        bookable_until: new Date(t.d_fin_preno_ts).getTime(),
        bookable: t.bookable,
        seatsTotal: t.posti,
        seatsTaken: t.postiOccupati,
    }) as BookingSlot) || [];
}
