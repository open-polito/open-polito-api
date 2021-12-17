import Device from "./device";
import { checkError } from "./utils";
import { parse as parseDate } from "date-format-parse"

type BookingContextID = "AULE_STUDIO" | "LEZIONI" | string

type BookingSubcontext = {
    id: string
    ita: {
        title: string
        privacy_notice: string // "Gentile Utente, per potersi prenotare è necessario [...] Dichiaro di aver preso visione dell’informativa sopra riportata"
        green_pass_notice: string // "L'accesso in Ateneo è consentito soltanto se in possesso di [...]"
    }
    eng: {
        title: string
        privacy_notice: string
        green_pass_notice: string
    }
    slot_duration: number // in minutes
    open_time: number // time of day when this subcontext opens (eg. "8" for "Help desk" means the help desk opens at 8 am)
    close_time: number // likewise. 24-hour format
    max_booking_per_day: number // how many slots can be booked per day
    has_seat_selection: boolean
}

type BookingContext = {
    id: string
    ita: {
        title: string
        description: string
    }
    eng: {
        title: string
        description: string
    }
    subcontexts: BookingSubcontext[] // may be undefined, eg. for lessons
}

type BookingSlot = {
    slot_start: Date
    slot_end: Date
    bookable_from: Date
    bookable_until: Date
    bookable: boolean
    seatsTotal: number
    seatsTaken: number
}

class Booking {
    // Example values are reported for a booking for a study room
    context_id: BookingContextID // "AULE_STUDIO"
    context_name: string         // "Prenotazione posti in sale studio"
    subcontext_id: string        // "AS_LINGOTTO_2"
    subcontext_name: string      // Lingotto - Sala studio Le Corbusier
    start_time: Date
    end_time: Date
    course_id?: string           // "01PECQW" (only for lessons)

    static barcode_url(username: string): string {
        return `https://didattica.polito.it/bc/barcode.php?barcode=${username}&width=500&height=200&format=gif`
    }
}

async function getBookings(device: Device): Promise<Booking[]> {
    const bookings_data = await device.post("booking_api.php", { operazione: "getBookings" });
    checkError(bookings_data);
    return bookings_data.data.booking_api.data.map(b => {
        const ret = new Booking();
        ret.context_id = b.id_ambito;
        ret.context_name = b.descr_ambito;
        ret.subcontext_id = b.id_subambito;
        ret.subcontext_name = b.nome_subambito;
        ret.start_time = new Date(b.d_ini_turno_ts);
        ret.end_time = new Date(b.d_fin_turno_ts);
        const matches = b.lezione.match(/<h3><b>([^<]+)<\/h3><\/b>/);
        if (matches == null) {
            ret.course_id = undefined;
        } else {
            const lesson = matches[1];
            const parts = lesson.split(" ");
            ret.course_id = parts[parts.length - 1];
        }
        return ret;
    });
}

async function getContexts(device: Device): Promise<BookingContext[]> {
    const bookings_data = await device.post("booking_api.php", { operazione: "getAmbiti" });
    checkError(bookings_data);
    return bookings_data.data.booking_api.ambiti.map(c => ({
        id: c.id,
        ita: {
            title: c.titolo_ita,
            description: c.descr_ita,
        },
        eng: {
            title: c.titolo_eng.trim(),
            description: c.descr_eng.trim(),
        },
        subcontexts: c.subambiti?.subambiti?.map(s => ({
            id: s.id,
            ita: {
                title: s.titolo_ita,
                privacy_notice: s.opt_tpl_privacy,
                green_pass_notice: s.opt_tpl_gp
            },
            eng: {
                title: s.titolo_eng.trim(),
                privacy_notice: s.opt_tpl_privacy,
                green_pass_notice: s.opt_tpl_gp
            }
        }) as BookingSubcontext)
    }) as BookingContext);
}

async function getSlots(device: Device, context_id: string, subcontext_id?: string): Promise<BookingSlot[]> {
    let input: any = {
        operazione: "getTurni",
        ambito: context_id,
        from: (new Date()).getTime(), to: (new Date()).getTime() + 1000 * 3600 * 24
    }
    if (subcontext_id)
        input.subambito = subcontext_id
    const bookings_data = await device.post("booking_api.php", input);
    checkError(bookings_data);
    return bookings_data.data.booking_api.turni.map(t => ({
        slot_start: parseDate(t.d_ini, "DD/MM/YYYY hh:mm"),
        slot_end: parseDate(t.d_fin, "DD/MM/YYYY hh:mm"),
        bookable_from: new Date(t.d_ini_preno_ts),
        bookable_until: new Date(t.d_fin_preno_ts),
        bookable: t.bookable,
        seatsTotal: t.posti,
        seatsTaken: t.postiOccupati,
    }) as BookingSlot);
}

export { Booking, BookingSlot, BookingContext, BookingSubcontext, getBookings, getContexts, getSlots };