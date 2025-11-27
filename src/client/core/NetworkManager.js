import { io } from "socket.io-client";
import { LocalServer } from "./LocalServer.js";
import { RemoteServer } from "./RemoteClientAdapter.js";

export class NetworkManager {
    constructor(url) {
        this.url = url
        this.socket = null;
        this.mode = 'pending'; // pending, remote, local
        this.eventHandlers = {};
    }

    /**
     * Main entry point.
     * Uses async/await with try/catch for readable flow control.
     */
  async connect() {
    try {
      console.log(`Attempting connection to ${this.url}`);
      
      // 1. Get the raw connected Socket.IO instance
      const rawSocket = await this._tryRemoteConnection();
      
      // 2. WRAP the raw socket in the RemoteServer adapter for symmetrical interface
      this.socket = new RemoteServer(rawSocket); // <-- CHANGE HERE: Use the adapter
      
      this.mode = 'remote';
      console.log("✅ CONNECTED TO REMOTE SERVER");
      this.applyListeners();
      return 'remote';

    } catch (error) {
      console.warn(`❌ Remote connection failed: ${error.message}`);
      
      // 2. Fallback logic: switch to LocalServer
      this.switchToLocal();
      return 'local';
    }
  }

    /**
     * Internal Helper: Wraps Socket.IO events in a Promise.
     * This bridges the gap between Event-based logic and Async/Await.
     */
    _tryRemoteConnection() {
        return new Promise((resolve, reject) => {
            // Initialize socket with strict timeout options
            const tempSocket = io(this.url, {
                reconnection: false, // Fail immediately if initial connect fails
                timeout: 1000,       // 2 second timeout
                autoConnect: true
            });

            // SUCCESS: Resolve the promise with the active socket
            tempSocket.on("connect", () => {
                resolve(tempSocket);
            });

            // FAILURE: Reject the promise (triggers the catch block above)
            tempSocket.on("connect_error", (err) => {
                tempSocket.close(); // Clean up the failed socket instance
                reject(err);
            });
        });
    }

    /**
     * Switches the internal socket to the LocalServer instance
     */
    switchToLocal() {
        if (this.mode === 'local') return;

        // Double check: ensure any existing remote socket is closed
        if (this.socket && this.socket.connected) {
            this.socket.close();
        }

        this.mode = 'local';
        this.socket = new LocalServer();

        console.log("⚠️ Switched to Local Server (Offline Mode)");
        this.applyListeners(); // Re-attach game events to the new local "server"
    }

    // --- Interface Methods (Same as before) ---

    send(event, data) {
        if (this.socket) {
            this.socket.emit(event, data);
        }
    }

    on(event, callback) {
        this.eventHandlers[event] = callback;
        // Attach immediately if we already have a socket/server
        if (this.socket) {
            // Prevent duplicate listeners if attaching dynamically
            if (this.socket.off) this.socket.off(event);
            this.socket.on(event, callback);
        }
    }

    applyListeners() {
        if (!this.socket) return;

        for (const [event, callback] of Object.entries(this.eventHandlers)) {
            // Clean up old listeners first
            if (this.socket.off) this.socket.off(event);
            this.socket.on(event, callback);
        }
    }
}