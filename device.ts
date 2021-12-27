import { checkError, post } from "./utils.js";
import User from "./user.js";

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

type RequestLogger = (event: {endpoint: string, request: string, response: string}) => void;

export default class Device {
    uuid: string
    token?: string;
    request_logger: RequestLogger;
    base_url: string;

    constructor(uuid: string, request_logger: RequestLogger = () => { }, base_url = "https://app.didattica.polito.it/") {
        this.uuid = uuid;
        this.request_logger = request_logger;
        this.base_url = base_url;
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

        const register_data = await post(this.base_url, "register.php", data);
        this.request_logger({
            endpoint: "register.php",
            request: JSON.stringify(data),
            response: JSON.stringify(register_data),
        });
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

        const user_data = (await post(this.base_url, "login.php", data));
        this.request_logger({
            endpoint: "login.php",
            request: JSON.stringify(data),
            response: JSON.stringify(user_data),
        });
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

        const user_data = (await post(this.base_url, "login.php", data));
        this.request_logger({
            endpoint: "login.php",
            request: JSON.stringify(data),
            response: JSON.stringify(user_data),
        });
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
        const response = await post(this.base_url, endpoint, Object.assign({ regID: this.uuid, token: this.token!! }, data));
        this.request_logger({
            endpoint,
            request: JSON.stringify(data),
            response: JSON.stringify(response),
        });
        return response;
    }
}
