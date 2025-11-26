import { GameLogic } from "@solblade/common/core/GameLogic";

/**
 * LocalServer.js
 * * This class acts as a mock server instance that runs locally in the browser,
 * providing the exact same interface (on/emit) as the Socket.IO client.
 * * It now uses composition to integrate a separate GameLogic instance.
 */

export class LocalServer {
  constructor() {
    this.handlers = {};
    this.connected = true; 
    
    // COMPOSITION: Define the broadcaster function first
    const broadcaster = (event, data) => {
        // The broadcaster looks up the client's registered handler and executes it.
        if (this.handlers[event]) {
            this.handlers[event](data);
        } else {
            console.warn(`[LocalServer Broadcast] No client handler registered for event: ${event}`);
        }
    };
    
    // Instantiate the core logic, passing it the broadcaster
    this.gameLogic = new GameLogic(broadcaster);
    
    // Start the local game logic loop immediately
    this.gameLogic.start();
    
    console.log("LocalServer initialized with GameLogic.");
  }

  /**
   * Registers a callback function for a specific event (called by NetworkManager.applyListeners).
   */
  on(event, callback) {
    this.handlers[event] = callback;
  }

  /**
   * Removes a callback function for a specific event.
   */
  off(event) {
    delete this.handlers[event];
  }

  /**
   * Simulates sending an event to the server.
   * This method acts as a network router, directing the event to GameLogic.
   */
  emit(event, data) {
    console.log(`[LocalServer] Client event received: ${event}`);
    
    // Route the network event to the corresponding logic method
    switch (event) {
        case 'playerMove':
            // this.gameLogic.handlePlayerMove(data); // Assuming this method exists
            break;
        case 'playerShoot': 
            this.gameLogic.handlePlayerShoot(data);
            break;
        case 'restartGame':
            // this.gameLogic.restart(); // Assuming this method exists
            break;
        default:
            console.warn(`[LocalServer] Unhandled event type: ${event}`);
    }
  }

  close() {
    this.connected = false;
    this.handlers = {};
    // Clean up the fixed update timer to stop the local loop
    if (this.gameLogic && this.gameLogic.fixedUpdateTimer) {
        clearInterval(this.gameLogic.fixedUpdateTimer);
        console.log("LocalServer fixed update loop stopped.");
    }
    console.log("LocalServer closed.");
  }
}