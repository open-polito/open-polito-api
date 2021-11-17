import Device from "./device";

const device = new Device("ea27a150-39d5-4f6a-ae1e-51f38bfe0039");
(async () => {
    await device.register();
    const {user, token} = await device.loginWithCredentials("S123456", "password");
    console.log("Token:", token);
    console.log(await user.unreadMail());
    await user.populate();
    await user.carico_didattico.corsi[2].populate();
    console.log(user);
    console.log(user.carico_didattico.corsi[2]);
    console.log(await user.carico_didattico.corsi[2].download(33278489));
})();