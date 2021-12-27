import fetch from "isomorphic-unfetch";

const DEBUG = false;

// Do not use this directly, prefer Device.post.
export async function post(base_url: string, endpoint: string, data: {[key: string]: any}): Promise<any> {
    if (DEBUG)
        console.log("> POST " + endpoint);
    const req: Response = await fetch(base_url + endpoint, {
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