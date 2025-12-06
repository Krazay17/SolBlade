export class LocalTransport {
    constructor(server) {
        this.id = "1";
        this.server = server;        // LocalServerTransport
        this.handlers = new Map();   // event => [handlers]
    }

    on(event, handler) {
        if (!this.handlers.has(event)) this.handlers.set(event, []);
        this.handlers.get(event).push(handler);
    }

    emit(event, data) {
        if (this.server) this.server._recv(event, data);
    }

    _recv(event, data) {
        const handlers = this.handlers.get(event);
        if (handlers) handlers.forEach(h => h(data));
    }

    close() {}
}
