import { Server } from "socket.io";
import http from "http";
import repl from 'repl';
import { GameLogic } from "@solblade/common/core/GameLogic.js";
import RAPIER from "@dimforge/rapier3d-compat";
import 'dotenv/config';


const SERVER_VERSION = 1.14;
const server = http.createServer();
const PORT = 8080;
const origin = ["https://solblade.online", "http://localhost:5173"];

/** @type {GameLogic} */
let game;

// NEW: Declare 'io' at the module level so 'broadcast' and 'setupSocketServer' can access it.
let io;

/**
 * 1. DEFINE THE SERVER-SIDE BROADCASTER
 * This function allows GameLogic to send events out to all connected clients.
 * It must be defined where the 'io' object is accessible.
 */
const broadcast = (event, data) => {
    // We assume most state updates should go to everyone, 
    // but GameLogic can also be updated to target specific sockets if needed.
    // 'io' is now defined at the module scope.
    if (io) {
        io.emit(event, data);
    } else {
        console.error("Socket.IO server (io) is not yet initialized for broadcasting.");
    }
};

async function init() {
    await RAPIER.init();

    // 2. INSTANTIATE GAME LOGIC WITH THE BROADCASTER
    game = new GameLogic(broadcast);
    await game.start();

    // Set up the Socket.IO server after GameLogic is ready
    setupSocketServer();
}

// Separate function for cleaner startup
function setupSocketServer() {
    // We assign the new Server instance to the module-level 'io' variable
    io = new Server(server, {
        cors: { origin, methods: ["GET", "POST"] },
        connectTimeout: 5000,
        pingInterval: 5000,
        pingTimeout: 10000,
        cleanupEmptyChildNamespaces: true,
    });

    io.on('connection', (socket) => {
        //@ts-ignore
        if (socket.bound) return;
        //@ts-ignore
        socket.bound = true;

        console.log(`Client connected: ${socket.id}`);

        // OPTIONAL: Add client to GameLogic's internal player registry
        game.addPlayer(socket.id);

        // 3. ROUTE ALL CLIENT INPUTS TO GAME LOGIC
        // Use socket.onAny to capture ALL events sent by the client (playerMove, playerShoot, etc.)
        socket.onAny((event, data) => {
            // Forward the event to the centralized GameLogic handler
            game.handleClientInput(socket.id, event, data);
        });

        socket.on('disconnect', () => {
            console.log(`Client disconnected: ${socket.id}`);
            game.removePlayer(socket.id);
        });

    });
}

// Start the server application
init().then(() => {
    server.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
});

// Setup REPL for server debugging
const r = repl.start({
    prompt: 'Server> ',
    input: process.stdin,
    output: process.stdout,
});

const test = () => {
    console.log("Hello!");
}
r.context.sharedTest = test;
r.context.game = game; // Make GameLogic available in REPL