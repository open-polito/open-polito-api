import fetch from "isomorphic-unfetch";

export type APIResponse = {
	data: any,
	esito: {
		[context: string]: { stato: number, error?: string }
	}
};

/**
 * Makes a POST request to an API endpoint.
 * 
 * @param base_url The API domain, with a trailing slash
 * @param endpoint The endpoint name
 * @param data A key-value map of parameters
 * @param timeout The request timeout: the function will throw an error if no response is received after this many milliseconds
 * @remarks
 * 
 * This is a "raw" function, you will likely want {@link Device.post} in order to pass the UUID.
 * @returns An arbitrary object
 */
export async function post(base_url: string, endpoint: string, data: {[key: string]: any}, timeout = 3000): Promise<APIResponse> {
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

/**
 * Checks that the API server is up.
 * 
 * @param base_url The API domain, with a trailing slash (default: the Polito server)
 */
export async function ping(base_url = "https://app.didattica.polito.it/"): Promise<void> {
	const data = await post(base_url, "ping.php", {});
	checkError(data);
}

/**
 * Checks if the API response contains an error, and throws it
 * 
 * @param data The API response
 * @internal
 */
export function checkError(data: APIResponse): void {
	for (const key in data.esito) {
		const context = data.esito[key]!; // eslint-disable-line @typescript-eslint/no-non-null-assertion
		if (context.stato < 0)
			throw new UpstreamError(context.error!, context.stato); // eslint-disable-line @typescript-eslint/no-non-null-assertion
	}
}

/**
 * Wraps an error from the upstream API.
 */
export class UpstreamError extends Error {
	/** The error code */
	code: number

	constructor(msg: string, code: number) {
		super(msg);
		// https://stackoverflow.com/a/41429145
		this.code = code;
		Object.setPrototypeOf(this, UpstreamError.prototype);
	}
}