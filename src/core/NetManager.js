import { io } from "socket.io-client";
import MyEventEmitter from "./MyEventEmitter";

const serverURL = location.hostname === "localhost" ?
    "http://localhost:3000"
    : "solbladeserver-production.up.railway.app";
const socket = io(serverURL);

let pendingRequests = {};

socket.on("connect", () => {
    console.log(`I connected with id: ${socket.id}`);
    MyEventEmitter.on("playerReady", (data) => {
        socket.emit("playerReady", { id: socket.id, data });
        socket.on("initData", (data) => {
            console.log(data);
        })
    });
});

setInterval(() => {
    socket.emit('heartbeat');
}, 500);

MyEventEmitter.on('playerMove', () => {
    if (!socket.connected && !socket.active) {
        socket.connect();
    }
})

export function initSocket() {
    return socket;
}

function queGameRequest(requestId, resolve, reject) {
    pendingRequests[requestId] = { resolve, reject };
}

function resolveGameRequest(requestId, data) {
    if (pendingRequests[requestId]) {
        pendingRequests[requestId].resolve(data);
        delete pendingRequests[requestId];
    }
}