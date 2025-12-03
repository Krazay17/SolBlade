export class LocalTransport {
    constructor(server) {
        this.server = server;
        this.handlers = new Map();
    }
    on(event, handler) {
        this.handlers.set(event, handler);
    }
    emit(event, data) {
        if (this.server) this.server._recv(event, data);
    }
    _recv(event, data) {
        const h = this.handlers.get(event);
        if (h) h(data);
    }
    close() { }
}