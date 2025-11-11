import { Server } from "socket.io";
import http from "http";
import { sharedTest } from "@solblade/shared";
import repl from 'repl';
import SGame from "./SGame.js";
import SVoiceChat from "./core/SVoiceChat.js";

const SERVER_VERSION = 1.13;

const server = http.createServer();
const PORT = 8080;
const origin = ["https://solblade.online", "http://localhost:5173"];

export const io = new Server(server, {
    cors: { origin, methods: ["GET", "POST"] },
    connectTimeout: 5000,
    pingInterval: 10000,
    pingTimeout: 20000,
    cleanupEmptyChildNamespaces: true,
});

const playerSockets = {};

const game = new SGame(io);
const voiceChat = new SVoiceChat(io);


io.on('connection', (socket) => {
    if (socket.bound) return;
    playerSockets[socket.id] = socket;
    
    socket.bound = true;
    const ip = socket.handshake.address;
    console.log(`New connection from ${ip} with id: ${socket.id}`);

    socket.emit('serverVersion', SERVER_VERSION);

    voiceChat.bindSockets(socket);

    socket.on('disconnect', () => {
        console.log('user disconnected: ' + socket.id);
        socket.broadcast.emit('userDisconnected', socket.id);
        game.userDisconnect(socket.id);
    });
    socket.on('joinGame', (data) => {
        game.userJoin(socket, data)
    });
});

server.listen(PORT);
console.log(`Server is running on port ${PORT}`);

const r = repl.start({
    prompt: 'Server> ',
    input: process.stdin,
    output: process.stdout,
})

r.context.sharedTest = sharedTest