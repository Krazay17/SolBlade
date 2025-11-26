/**
 * RemoteServer.js (Conceptual Client-Side Adapter)
 * * * This class acts as a client-side wrapper around the raw Socket.IO connection.
 * * It provides the same 'on' and 'emit' interface as LocalServer, ensuring symmetry.
 * * It allows for client-side logging or event interception before transmission.
 */

import { Socket } from "socket.io-client";

export class RemoteServer {
  /**
   * @param {Socket} socketInstance - The already connected Socket.IO client instance.
   */
  constructor(socketInstance) {
    if (!socketInstance) {
        throw new Error("RemoteServer must be initialized with a connected Socket.IO instance.");
    }
    // Store the underlying, connected Socket.IO object
    this.socket = socketInstance;
    
    // Flag for compatibility with NetworkManager cleanup
    this.connected = this.socket.connected; 
    
    console.log("RemoteServer Adapter initialized.");
  }

  /**
   * Passes the listener straight through to the underlying Socket.IO instance.
   * @param {string} event - The event name.
   */
  on(event, callback) {
    this.socket.on(event, callback);
  }

  /**
   * Passes the event straight through to the underlying Socket.IO instance.
   * This method is where your 'playerShoot' or 'playerMove' events get sent
   * over the wire to the real backend server running the GameLogic.
   * @param {string} event - The name of the event to emit.
   * @param {any} data - The data payload.
   */
  emit(event, data) {
    // You could add client-side logging or payload modification here.
    console.log(`[RemoteClient] Emitting event to backend: ${event}`, data);
    
    this.socket.emit(event, data);
  }
  
  /**
   * Passes the removal straight through.
   */
  off(event) {
    this.socket.off(event);
  }

  /**
   * Closes the underlying Socket.IO connection.
   */
  close() {
    this.socket.close();
    this.connected = false;
    console.log("RemoteServer Adapter closed connection.");
  }
}