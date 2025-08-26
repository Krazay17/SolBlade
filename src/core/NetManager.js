import { io } from "socket.io-client";
import MyEventEmitter from "./MyEventEmitter";

const serverURL = location.hostname === "localhost" ?
    "http://localhost:3000"
    : "solbladeserver-production.up.railway.app";
export const socket = io(serverURL);

let scene = null;
let netPlayers = {};

socket.on("connect", () => {
    console.log(`I connected with id: ${socket.id}`);

    socket.on("disconnect", () => {
        console.log("disconnected from server");
    });
    if (scene) {
        bindSocketEvents(scene.fullNetSync());
    } else {
        MyEventEmitter.once('netSceneSet', bindSocketEvents);
    }
});

function bindSocketEvents(myPlayerData) {
    if (!scene) return;

    socket.emit('joinGame', myPlayerData);

    socket.on('currentPlayers', (playerList) => {
        playerList.forEach(element => {
            if (element.id === socket.id) return;
            netPlayers[element.id] = scene.addPlayer(element.id, element.data);
        });
    });
    socket.on('newPlayer', ({ id, data }) => {
        if (id === socket.id) return;
        netPlayers[id] = scene.addPlayer(id, data);
    });
    socket.on('playerDisconnected', (playerId) => {
        netPlayers[playerId].removeFromWorld(playerId);
        delete netPlayers[playerId];
    })
    socket.on('playerNetUpdate', ({ id, data }) => {
        if (netPlayers[id]) {
            console.log(data);
            netPlayers[id].position.copy(data.pos);
            netPlayers[id].rotation.y = data.rot;
            netPlayers[id].setAnimState(data.state);
            //console.log(`Player ${id} position updated: ${data.position} state: ${data.state}`);
            //netPlayers[id].quaternion.set(data.qx, data.qy, data.qz, data.qw);
        }
    });
    socket.on('playerStateUpdate', ({ id, data }) => {
        if (netPlayers[id]) {
            netPlayers[id].setAnimState(data);
        }
    });
}

setInterval(() => {
    socket.emit('heartbeat');
}, 1000);

export function setNetScene(s, myPlayerData) {
    scene = s;
    MyEventEmitter.emit('netSceneSet', myPlayerData);
}

export function initSocket() {
    return socket;
}

export const defaultPlayerData = {
    scene: null,
    pos: { x: 0, y: 5, z: 0 },
    rot: 0,
    state: 'idle',
    name: 'Player',
    money: 0,
}

export function playerNetData(overrides = {}) {
    return { ...defaultPlayerData, ...overrides };
}