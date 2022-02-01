import fetch from "isomorphic-unfetch";

// Do not use this directly, prefer Device.post.
export async function post(base_url: string, endpoint: string, data: {[key: string]: any}, timeout: number = 3000): Promise<any> {
    // Handles timeouts in fetch(). https://www.npmjs.com/package/node-fetch#request-cancellation-with-abortsignal
    const controller = new AbortController();
    const timeoutFn = setTimeout(() => {
        controller.abort();
    }, timeout);

    let req: Response;
    try {
        req = await fetch(base_url + endpoint, {
            signal: controller.signal,
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            },
            body: "data=" + encodeURIComponent(JSON.stringify(data)),
        });
    } finally {
        clearTimeout(timeoutFn);
    }
    return JSON.parse(await req.text());
}

export async function ping(base_url = "https://app.didattica.polito.it/"): Promise<void> {
    const data = await post(base_url, "ping.php", {});
    checkError(data);
}

export async function checkError(data: {esito: object}) {
    for (const key in data.esito)
        if (data.esito[key].stato < 0)
            throw new UpstreamError(data.esito[key].error, data.esito[key].stato);
}

// https://stackoverflow.com/a/41429145
export class UpstreamError extends Error {
    code: number

    constructor(msg: string, code: number) {
        super(msg);
        this.code = code;
        Object.setPrototypeOf(this, UpstreamError.prototype);
    }
}