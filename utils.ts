const fetch = require("isomorphic-unfetch");

const DEBUG = false;

export async function post(endpoint: string, data: any): Promise<any> {
    if (DEBUG)
        console.log("> POST " + endpoint);
    const req: Response = await fetch("https://app.didattica.polito.it/" + endpoint, {
        "method": "POST",
        "headers": {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        },
        "body": "data=" + encodeURIComponent(JSON.stringify(data)),
    });
    const ret = JSON.parse(await req.text());
    if (DEBUG)
        console.log("< ", ret);
    return ret;
}

export async function checkError(data: {esito: object}) {
    for (const key in data.esito)
        if (data.esito[key].stato < 0)
            throw new Error(`Esito negativo: ${data.esito[key].error} (${key}=${data.esito[key].stato})`);
}