import { getBookings, getSlots } from "../booking";
import { getExtendedCourseInformation } from "../course";
import { getCoursesInfo } from "../courses";
import { Device } from "../device";
import { getDownloadURL } from "../material";
import { getTimetable } from "../timetable";
import { getUnreadMail } from "../user";
import { ping } from "../utils";

const device = new Device("ea27a150-39d5-4f6a-ae1e-51f38bfe0039");
(async () => {
    await ping();
    await device.register();
    const { token } = await device.loginWithCredentials("S123456", "password");
    console.log("Token:", token);
    console.log("Unread mail:", await getUnreadMail(device));
    console.log("Timetable:", await getTimetable(device));
    const courses_info = await getCoursesInfo(device);
    console.log("Courses:", courses_info);
    const course = await getExtendedCourseInformation(device, courses_info.course_plan.standard[2]!!);
    console.log("Course:", course);
    console.log(courses_info.course_plan.standard[2]);
    console.log(await getDownloadURL(device, 33278489));
    const bookings = await getBookings(device);
    console.log("Bookings:", bookings);
    console.log(await getSlots(device, "AULE_STUDIO", "AS_LINGOTTO_2", new Date("2021-12-21T12:03:04.564Z")));
    await device.logout();
})();