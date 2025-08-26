import { io } from "socket.io-client";
import MyEventEmitter from "./MyEventEmitter";

const serverURL = location.hostname === "localhost" ?
    "http://localhost:3000"
    : "solbladeserver-production.up.railway.app";
export const socket = io(serverURL);

let scene = null;

socket.on("connect", () => {
    console.log(`I connected with id: ${socket.id}`);

    socket.on("disconnect", () => {
        console.log("disconnected from server");
    });
    if (scene) {
        bindSocketEvents(scene.fullNetSync());
        console.log(scene.fullNetSync());
    } else {
        MyEventEmitter.once('netSceneSet', bindSocketEvents);
    }
});

function bindSocketEvents(myPlayerData) {
    if (!scene) return;
    socket.emit('joinGame', myPlayerData);
    socket.on('currentPlayers', (playerList) => {
        playerList.forEach(element => {
            scene.addPlayer({ id: element.id, ...element.data });
            console.log('Current Players: ', element);
        });
    });
    socket.on('newPlayer', (playerInfo) => {
        scene.addPlayer(playerInfo);
    });
    socket.on('playerDisconnected', (playerId) => {
        scene.removePlayer(playerId);
    })
}

setInterval(() => {
    socket.emit('heartbeat');
}, 1000);

export function setNetScene(s, myPlayerData) {
    scene = s;
    MyEventEmitter.emit('netSceneSet', { myPlayerData })
}

export function initSocket() {
    return socket;
}

export const defaultPlayerData = {
    id: null,
    scene: null,
    pos: { x: 0, y: 5, z: 0 },
    state: 'idle',
    name: 'Player',
    money: 0,
}

export function playerNetData(id, overrides = {}) {
    return { ...defaultPlayerData, id, ...overrides };
}