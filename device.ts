import { checkError, post } from "./utils";
import User from "./user";

type DeviceData = {
    platform: string,
    version: string,
    model: string,
    manufacturer: string
};

const defaultDeviceData: DeviceData = {
    platform: "Open Polito",
    version: "1",
    model: "Potato",
    manufacturer: "Apple",
};

export default class Device {
    uuid: string
    token?: string;

    constructor(uuid: string) {
        this.uuid = uuid;
    }

    async register(deviceData: DeviceData = defaultDeviceData) : Promise<void> {
        const data = {
            regID: this.uuid,
            uuid: this.uuid,
            device_platform: deviceData.platform,
            device_version: deviceData.version,
            device_model: deviceData.model,
            device_manufacturer: deviceData.manufacturer
        };

        const register_data = await post("register.php", data);
        checkError(register_data);
    }

    async loginWithCredentials(username: string, password: string): Promise<{
        user: User,
        token: string
    }> {
        const data = {
            regID: this.uuid,
            username,
            password
        };

        const user_data = (await post("login.php", data));
        checkError(user_data);

        const token = user_data.data.login.token;
        this.token = token;
        const user = new User(this, {
            matricola: user_data.data.anagrafica.matricola,
            matricole: user_data.data.anagrafica.all_matricolas,
            nome: user_data.data.anagrafica.nome,
            cognome: user_data.data.anagrafica.cognome,
            tipo_corso_laurea: user_data.data.anagrafica.tipo_corso_laurea,
            nome_corso_laurea: user_data.data.anagrafica.nome_corso_laurea,
        });
        return {user, token};
    }

    async loginWithToken(username: string, login_token: string): Promise<{
        user: User,
        token: string
    }> {
        const data = {
            regID: this.uuid,
            username,
            token: login_token,
        };

        const user_data = (await post("login.php", data));
        checkError(user_data);

        const token = user_data.data.login.token;
        this.token = token;
        const user = new User(this, {
            matricola: user_data.data.anagrafica.matricola,
            matricole: user_data.data.anagrafica.all_matricolas,
            nome: user_data.data.anagrafica.nome,
            cognome: user_data.data.anagrafica.cognome,
            tipo_corso_laurea: user_data.data.anagrafica.tipo_corso_laurea,
            nome_corso_laurea: user_data.data.anagrafica.nome_corso_laurea,
        });
        return { user, token };
    }

    async post(endpoint: string, data: { [key: string]: any }): Promise<any> {
        return post(endpoint, Object.assign({ regID: this.uuid, token: this.token!! }, data));
    }
}
