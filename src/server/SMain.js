import { Server } from "socket.io";
import http from "http";
import { sendDiscordMessage } from "./core/DiscordStuff.js";
import { sharedTest } from "@solblade/shared";
import repl from 'repl';
import SGame from "./SGame.js";
import SVoiceChat from "./core/SVoiceChat.js";

const SERVER_VERSION = 1.08;

const server = http.createServer();
const PORT = Number(process.env.PORT) || 80;
const isLocal = PORT === 3000 || process.env.NODE_ENV === 'development';
const origin = isLocal ? 'http://localhost:5173' : "https://solblade.online";

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

sharedTest();

io.on('connection', (socket) => {
    if (socket.bound) return;
    playerSockets[socket.id] = socket;
    socket.bound = true;
    const ip = socket.handshake.address;
    console.log(`New connection from ${ip} with id: ${socket.id}`);

    socket.emit('serverVersion', SERVER_VERSION);

    voiceChat.bindSockets(socket);

    socket.on('disconnect', () => {
        socket.broadcast.emit('userDisconnected', socket.id);
        game.userDisconnect(socket.id);

        io.emit('serverMessage', { player: 'Server', message: `Player Disconnected: ${players[socket.id]?.name || 'null'}!`, color: 'red' });
        if (!isLocal && players[socket.id]) sendDiscordMessage(`Player Disconnected: ${players[socket.id].name}!`);
        console.log('user disconnected: ' + socket.id);
    });

    socket.on('joinGame', (data) => {
        game.userJoin(socket, data)
    });
});

function serializePlayers() {
    const data = {}
    for (const [id, p] of Object.entries(players)) {
        data[id] = p.serialize();
    }
    return data;
}

server.listen(PORT);
console.log(`Server is running on port ${PORT}`);

const r = repl.start({
    prompt: 'Server> ',
    input: process.stdin,
    output: process.stdout,
})

r.context.sharedTest = sharedTest