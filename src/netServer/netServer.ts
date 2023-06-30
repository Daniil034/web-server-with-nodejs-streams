import * as net from "net";
import {handleConnection} from "./handleConnection";
import {RequestHandler} from "./types";

function createWebServer(requestHandler: RequestHandler) {
    const server = net.createServer();
    server.on("connection", (socket) => handleConnection(socket, requestHandler));
    return {
        listen: (port: number, cb?: Function) => {
            server.listen(port);
            if (cb) cb();
        },
    };
}


const webServer = createWebServer((req, res) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    res.setHeader("Content-Type", "text/plain");
    res.end("Hello World!");
});

const PORT = 3000;

webServer.listen(PORT, () => {
    console.log("Server has started on the port " + PORT);
});