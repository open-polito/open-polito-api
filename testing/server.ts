import http from "http";
import fs from "fs";

const entries: { endpoint: string, request: string, response: string }[] = JSON.parse(fs.readFileSync("log.json", "utf8"));

const requestListener = function (req, res) {
	let post_data = "";
	req.on("data", chunk => { post_data += chunk; });
	req.on("end", function () {
		post_data = decodeURIComponent(post_data).substring(5).replace(/"regID":"[0-9a-f-]+","token":"[0-9a-f]+",?/, "");
		console.log(">", req.url, post_data);
		if (req.url == "/register.php") {
			res.writeHead(200);
			res.end("{}");
			return;
		}
		for (const entry of entries) {
			if (("/" + entry.endpoint) == req.url) {
				console.log(entry.request, post_data);
			}
			if (("/" + entry.endpoint) == req.url && entry.request == post_data) {
				res.writeHead(200);
				res.end(entry.response);
				return;
			}
		}
		res.writeHead(404);
		res.end(JSON.stringify({ esito: { "testing-server": { stato: -1, error: "No log entry matches your request" } } }));
	});
};

const server = http.createServer(requestListener);
console.log("Listening on :8080.");
server.listen(8080);
