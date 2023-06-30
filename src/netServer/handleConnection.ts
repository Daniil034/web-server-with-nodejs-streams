import * as net from "net";
import {RequestHandler, ResponseHeaders} from "./types";

const DIVIDER = "\r\n";
const END_OF_HEADER = DIVIDER + DIVIDER;

export function handleConnection(socket: net.Socket, requestHandler: RequestHandler) {
    socket.once("readable", function () {
        let reqBuffer = new Buffer("");
        let buf = socket.read();
        let reqHeader: string = "";
        while (true) {
            buf = socket.read();
            if (buf === null) break;
            reqBuffer = Buffer.concat([reqBuffer, buf]);
            let marker = reqBuffer.indexOf(END_OF_HEADER);
            if (marker !== -1) {
                let remaining = reqBuffer.slice(marker + 4);
                reqHeader = reqBuffer.slice(0, marker).toString();
                socket.unshift(remaining);
                break;
            }
        }

        const reqHeaders = reqHeader.split(DIVIDER);
        const reqLine = reqHeaders.shift()!.split(" ");

        const headers = reqHeaders.reduce((acc, currentHeader) => {
            const [key, value] = currentHeader.split(":");
            return {...acc, [key.trim().toLowerCase()]: value.trim()};
        }, {});

        const request = {
            method: reqLine[0],
            url: reqLine[1],
            httpVersion: reqLine[2].split("/")[1],
            headers,
            socket,
        };


        let status = 200;
        let statusText = "OK";
        let headersSent = false;
        let isChunked = false;
        const responseHeaders: ResponseHeaders = {
            server: "custom-server",
        };

        function setHeader(key: string, value: string | number) {
            responseHeaders[key] = value;
        }

        function sendHeaders() {
            if (!headersSent) {
                headersSent = true;
                setHeader("date", new Date().toISOString());
                socket.write(`HTTP/1.1 ${status} ${statusText}\r\n`);
                Object.keys(responseHeaders).forEach(headerKey => {
                    socket.write(`${headerKey}: ${responseHeaders[headerKey]}\r\n`);
                });
                socket.write("\r\n");
            }
        }

        const response = {
            write(chunk: Buffer) {
                if (!headersSent) {
                    if (!responseHeaders["content-length"]) {
                        isChunked = true;
                        setHeader("transfer-encoding", "chunked");
                    }
                    sendHeaders();
                }
                if (isChunked) {
                    const size = chunk.length.toString(16);
                    socket.write(`${size}\r\n`);
                    socket.write(chunk);
                    socket.write("\r\n");
                } else {
                    socket.write(chunk);
                }
            },
            end(chunk: Buffer) {
                if (!headersSent) {
                    if (!responseHeaders["content-length"]) {
                        setHeader("content-length", chunk.length || 0);
                    }
                    sendHeaders();
                }
                if (isChunked) {
                    const size = (chunk.length).toString(16);
                    socket.write(`${size}\r\n`);
                    socket.write(chunk);
                    socket.write("\r\n");
                    socket.end("0\r\n\r\n");
                } else {
                    socket.end(chunk);
                }
            },
            setHeader,
            setStatus(newStatus: number, newStatusText: string) {
                status = newStatus;
                statusText = newStatusText;
            },
            json(data: any) {
                if (headersSent) {
                    throw new Error("Headers sent, cannot proceed to send JSON");
                }
                const json = new Buffer(JSON.stringify(data));
                setHeader("content-type", "application/json; charset=utf-8");
                setHeader("content-length", json.length);
                sendHeaders();
                socket.end(json);
            },
        };
        requestHandler(request, response);
    });
}