// TODO: build my own socket module

export interface SocketOptions {
    hostname: string;
    port: number;
    pathname: string;
}

export interface Server {
    hostname: string;
    port: number;
    pathname: string;
    socket: WebSocket;
}

const developmentSocketOptions: SocketOptions = {
    hostname: "localhost",
    port: 8080,
    pathname: '/connection'
}

export class Server {
    constructor(socketOptions: SocketOptions) {
        this.hostname = socketOptions.hostname;
        this.port = socketOptions.port;
        this.pathname = socketOptions.pathname;
        this.socket = new WebSocket(`ws://${this.hostname}:${this.port}${this.pathname}`)
    }
}
