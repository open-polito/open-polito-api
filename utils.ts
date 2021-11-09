if (typeof fetch === "undefined") {
    const _importDynamic = new Function('modulePath', 'return import(modulePath)')

    async function fetch(...args) {
        const { default: fetch } = await _importDynamic('node-fetch');
        return fetch(...args);
    }
}

export async function post(endpoint: string, data: any): Promise<any> {
    console.log("> POST " + endpoint);
    const req: Response = await fetch("https://app.didattica.polito.it/" + endpoint, {
        "method": "POST",
        "headers": {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        },
        "body": "data=" + encodeURIComponent(JSON.stringify(data)),
    });
    const ret = JSON.parse(await req.text());
    // console.log("< ", ret);
    return ret;
}

export async function checkError(data: {esito: object}) {
    for (const key in data.esito)
        if (data.esito[key].stato < 0)
            throw new Error(`Esito negativo: ${key}=${data.esito[key].stato}`);
}