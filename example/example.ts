import { getSlots } from "../booking.js";
import Device from "../device.js";
import { getTimetable } from "../timetable.js";

const device = new Device("ea27a150-39d5-4f6a-ae1e-51f38bfe0039", () => {});
(async () => {
    await device.register();
    const { user, token } = await device.loginWithCredentials("S123456", "password");
    console.log("Token:", token);
    console.log("Unread mail:", await user.unreadMail());
    console.log("Timetable:", await getTimetable(device));
    await user.populate();
    await user.carico_didattico.corsi[2]!.populate();
    console.log("User:", user);
    console.log(user.carico_didattico.corsi[2]);
    console.log(await user.carico_didattico.corsi[2]!.download(33278489));
    await user.updateBookings();
    console.log("Bookings:", user.bookings);
    console.log(await getSlots(user.device, "AULE_STUDIO", "AS_LINGOTTO_2", new Date("2021-12-21T12:03:04.564Z")));
})();