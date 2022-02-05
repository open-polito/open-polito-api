import { checkError, post } from "./utils";
import { PersonalData } from "./user";

export type DeviceData = {
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

/** A network request */
export type Entry = { endpoint: string, request: { [key: string]: any }, response: { [key: string]: any } }
/** A function that logs network requests */
export type RequestLogger = (entry: Entry) => void;

/** A class with credentials for accessing the upstream API */
export class Device {
    /** A unique identifier for the device */
    uuid: string;
    /** A token for authorizing the user */
    token?: string;
    /** The request timeout in milliseconds */
    timeout: number;
    /** A callback for network requests */
    request_logger: RequestLogger;
    /** The base URL for the API */
    base_url: string;

    /**
     * @param uuid A unique identifier for the device
     * @param timeout The request timeout in milliseconds
     * @param request_logger A callback that is called after network requests
     * @param base_url The base URL for the API
     */
    constructor(uuid: string, timeout: number = 3000, request_logger: RequestLogger = () => { }, base_url = "https://app.didattica.polito.it/") {
        this.uuid = uuid;
        this.timeout = timeout;
        this.request_logger = request_logger;
        this.base_url = base_url;
    }

    /** Registers the device with the API (may be required to access notifications) */
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
            request: data,
            response: register_data,
        });
        checkError(register_data);
    }

    /** Logs in with username and password */
    async loginWithCredentials(username: string, password: string): Promise<{
        data: PersonalData,
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
            request: data,
            response: user_data,
        });
        checkError(user_data);

        const token = user_data.data.login.token;
        this.token = token;
        return {
            data: {
                current_id: user_data.data.anagrafica.matricola,
                ids: user_data.data.anagrafica.all_matricolas,
                name: user_data.data.anagrafica.nome,
                surname: user_data.data.anagrafica.cognome,
                degree_type: user_data.data.anagrafica.tipo_corso_laurea,
                degree_name: user_data.data.anagrafica.nome_corso_laurea,
            },
            token
        };
    }

    /** Refreshes an authorization token by returning a new one */
    async loginWithToken(username: string, login_token: string): Promise<{
        data: PersonalData,
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
            request: data,
            response: user_data,
        });
        checkError(user_data);

        const token = user_data.data.login.token;
        this.token = token;
        return {
            data: {
                current_id: user_data.data.anagrafica.matricola,
                ids: user_data.data.anagrafica.all_matricolas,
                name: user_data.data.anagrafica.nome,
                surname: user_data.data.anagrafica.cognome,
                degree_type: user_data.data.anagrafica.tipo_corso_laurea,
                degree_name: user_data.data.anagrafica.nome_corso_laurea,
            },
            token
        };
    }

    /** Invalidates the token */
    async logout(): Promise<void> {
        await this.post("logout.php", {});
    }

    /** Sends a raw API request, appending the device credentials */
    async post(endpoint: string, data: { [key: string]: any }): Promise<any> {
        const response = await post(this.base_url, endpoint, Object.assign({ regID: this.uuid, token: this.token! }, data), this.timeout);
        this.request_logger({
            endpoint,
            request: data,
            response: response,
        });
        return response;
    }
}
