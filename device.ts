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

    constructor(uuid: string) {
        this.uuid = uuid;
    }

    async register(deviceData: DeviceData = defaultDeviceData) {
        const data = {
            regID: this.uuid,
            uuid: this.uuid,
            device_platform: deviceData.platform,
            device_version: deviceData.version,
            device_model: deviceData.model,
            device_manufacturer: deviceData.manufacturer
        };

        const esito = (await post("register.php", data)).esito.generale.stato;
        // Todo: mappare gli esiti fallimentari
        if (esito < 0)
            throw new Error(`Registrazione fallita: esito=${esito}`);
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
        // Todo: mappare gli esiti fallimentari
        checkError(user_data);

        const token = user_data.data.login.token;
        const user = new User();
        user.uuid = this.uuid;
        user.token = token;
        user.anagrafica = {
            matricola: user_data.data.anagrafica.matricola,
            matricole: user_data.data.anagrafica.all_matricolas,
            nome: user_data.data.anagrafica.nome,
            cognome: user_data.data.anagrafica.cognome,
            tipo_corso_laurea: user_data.data.anagrafica.tipo_corso_laurea,
            nome_corso_laurea: user_data.data.anagrafica.nome_corso_laurea,
        }
        return {user, token};
    }

    async loginWithToken(username: string, token: string): Promise<{
        user: User,
        token: string
    }> {
        const data = {
            regID: this.uuid,
            username,
            token
        };

        const user_data = (await post("login.php", data));
        // Todo: mappare gli esiti fallimentari
        checkError(user_data);

        const user = new User();
        user.uuid = this.uuid;
        user.token = token;
        user.anagrafica = {
            matricola: user_data.data.anagrafica.matricola,
            matricole: user_data.data.anagrafica.all_matricolas,
            nome: user_data.data.anagrafica.nome,
            cognome: user_data.data.anagrafica.cognome,
            tipo_corso_laurea: user_data.data.anagrafica.tipo_corso_laurea,
            nome_corso_laurea: user_data.data.anagrafica.nome_corso_laurea,
        }
        return { user, token };
    }
}