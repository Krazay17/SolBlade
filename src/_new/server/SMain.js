import { Server } from "socket.io";
import http from "http";
import repl from 'repl';
import SGame from "./SGame.js";

console.log('SMain 2')

const SERVER_VERSION = 1.14;

const server = http.createServer();
const PORT = 8080;
const origin = ["https://solblade.online", "http://localhost:5173"];

const io = new Server(server, {
    cors: { origin, methods: ["GET", "POST"] },
    connectTimeout: 5000,
    pingInterval: 10000,
    pingTimeout: 20000,
    cleanupEmptyChildNamespaces: true,
});


const playerSockets = {};

const game = new SGame(io);


io.on('connection', (socket) => {
    if(socket.bound)return;
    socket.bound = true;
    
    console.log(socket.id);
})

server.listen(PORT);
console.log(`Server is running on port ${PORT}`);

const r = repl.start({
    prompt: 'Server> ',
    input: process.stdin,
    output: process.stdout,
})

const test = ()=>{
    console.log("Hello!");
}
r.context.sharedTest = test;