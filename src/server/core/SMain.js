import { Server } from "socket.io";
import http from "http";
import repl from 'repl';
import GameLogic from "@solblade/common/core/GameLogic";
import RAPIER from "@dimforge/rapier3d-compat";
import 'dotenv/config';


const SERVER_VERSION = 1.14;
const server = http.createServer();
const PORT = 8080;
const origin = ["https://solblade.online", "http://localhost:5173"];
let playerSockets = {};

async function init() {
    await RAPIER.init();
    const game = new GameLogic();
    await game.start();
}
init();

const io = new Server(server, {
    cors: { origin, methods: ["GET", "POST"] },
    connectTimeout: 5000,
    pingInterval: 5000,
    pingTimeout: 10000,
    cleanupEmptyChildNamespaces: true,
});

io.on('connection', (socket) => {
    if (socket.bound) return;
    socket.bound = true;
    playerSockets[socket.id] = socket;
    console.log(socket.id);

    socket.on("hello", (c) => {
        c(SERVER_VERSION);
    });

})

server.listen(PORT);
console.log(`Server is running on port ${PORT}`);

const r = repl.start({
    prompt: 'Server> ',
    input: process.stdin,
    output: process.stdout,
})

const test = () => {
    console.log("Hello!");
}
r.context.sharedTest = test;