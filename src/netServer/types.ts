import net from "net";

export type ResponseHeaders = { server: string } & Headers

type Headers = {
    [key: string]: Header
}

type Header = string | number

export type Request = {
    method: string,
    url: string,
    httpVersion: string,
    headers: Headers,
    socket: net.Socket,
}

export type Response = {
    write(chunk: Buffer): void,
    end(chunk: Buffer | string): void,
    setHeader(key: string, value: string | number): void,
    setStatus(newStatus: number, newStatusText: string): void,
    json(data: any): void,
}

export type RequestHandler = {
    (req: Request, res: Response): void
}