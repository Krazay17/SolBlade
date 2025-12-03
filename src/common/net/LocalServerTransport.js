export class LocalServerTransport {
    constructor() {
        this.handlers = new Map();
        this.client = null;
    }

    on(event, handler) {
        this.handlers.set(event, handler);
    }

    emit(event, data) {
        if (this.client) this.client._recv(event, data);
    }

    sendTo(clientId, event, data) {
        this.emit(event, data);
    }

    broadcast(event, data) {
        this.emit(event, data);
    }
    to(id) {
        return {
            emit: (event, data) => {
                this.emit(event, data);
            }
        }
    }
    _recv(event, data) {
        const h = this.handlers.get(event);
        if (h) h(data);
    }
    close(){}
}
