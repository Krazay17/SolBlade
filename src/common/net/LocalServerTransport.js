export class LocalServerTransport {
    constructor() {
        this.handlers = new Map();  // event => [handlers]
        this.clients = new Set();   // can be multiple clients
    }

    on(event, handler) {
        if (!this.handlers.has(event)) this.handlers.set(event, []);
        this.handlers.get(event).push(handler);
    }

    emit(event, data) {
        // Send to all clients
        this.clients.forEach(client => client._recv(event, data));
    }

    sendTo(client, event, data) {
        client._recv(event, data);
    }

    addClient(client) {
        this.clients.add(client);
        client.server = this;
    }

    removeClient(client) {
        this.clients.delete(client);
        client.server = null;
    }

    _recv(event, data) {
        const handlers = this.handlers.get(event);
        if (handlers) handlers.forEach(h => h(data));
    }

    to(id) {
        const client = [...this.clients].find(c => c.id === id);
        return { emit: (event, data) => client._recv(event, data) };
    }

    close() { }
}
