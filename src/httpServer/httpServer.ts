import * as http from "http";

const httpServer = http.createServer();

httpServer.on("request", (req, res) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    res.setHeader("Content-Type", "text/plain");
    res.end("Response confirmed");
});

httpServer.on("connection", (socket) => {
    socket.on("data", (chunk) => {
        console.log("received chunk:\n", chunk.toString());
    });
    socket.write(`HTTP/1.1 200 OK\\r\\nServer: my-web-server\\r\\nContent-Length: 0\\r\\n\\r\\n`);
});

const PORT = 3000;

httpServer.listen(PORT, () => {
    console.log("Server has started on the port " + String(PORT));
});