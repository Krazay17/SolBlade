// Shared/EventEmitter.js

export class EventEmitter {
    constructor() {
        this.listeners = new Map(); // Stores eventName -> [callbacks]
    }

    /**
     * Registers a callback function for a specific event.
     * @param {string} eventName - The name of the event to listen for (e.g., 'actor_added').
     * @param {function} callback - The function to execute when the event fires.
     */
    on(eventName, callback) {
        if (!this.listeners.has(eventName)) {
            this.listeners.set(eventName, []);
        }
        this.listeners.get(eventName).push(callback);
    }

    /**
     * Unregisters a callback function (important for cleanup).
     * @param {string} eventName
     * @param {function} callback
     */
    off(eventName, callback) {
        const callbacks = this.listeners.get(eventName);
        if (callbacks) {
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    /**
     * Triggers all registered callbacks for a specific event.
     * @param {string} eventName
     * @param {...*} args - Arguments to pass to the callbacks.
     */
    emit(eventName, ...args) {
        const callbacks = this.listeners.get(eventName);
        if (callbacks) {
            // Use slice() to prevent issues if a listener modifies the array
            callbacks.slice().forEach(callback => {
                try {
                    callback(...args);
                } catch (e) {
                    console.error(`Error in event listener for ${eventName}:`, e);
                }
            });
        }
    }
}