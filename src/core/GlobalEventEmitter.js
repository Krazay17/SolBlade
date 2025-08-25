let events = {};

export const MyEventEmitter = {
    on: (event, listener) => {
        if (!events[event]) {
            events[event] = [];
        }
        events[event].push(listener);
    },
    off: (event, listener) => {
        if (!events[event]) return;
        events[event] = events[event].filter(l => l !== listener);
    },
    emit: (event, data) => {
        if (!events[event]) return;
        events[event].forEach(listener => listener(data));
    }
};

export default MyEventEmitter;