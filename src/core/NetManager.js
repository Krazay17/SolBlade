import { io } from "socket.io-client";
import MyEventEmitter from "./MyEventEmitter";
import { Vector3 } from "three";

const serverURL = location.hostname === "localhost" ?
    "http://localhost:3000"
    : "solbladeserver-production.up.railway.app";

const socket = io(serverURL);
export const netSocket = socket;

let scene = null;
let netPlayers = {};

export const defaultPlayerData = {
    scene: null,
    pos: { x: 0, y: 5, z: 0 },
    rot: 0,
    state: 'idle',
    name: 'Player',
    money: 0,
    health: 100,
}

let lastPlayerData = { ...defaultPlayerData };

socket.on("connect", () => {
    console.log(`I connected with id: ${socket.id}`);
    if (scene) {
        bindSocketEvents(scene.fullNetSync());
    } else {
        MyEventEmitter.once('netSceneSet', bindSocketEvents);
    }
});

function bindSocketEvents(myPlayerData) {
    if (!scene) return;
    lastPlayerData = { ...myPlayerData };

    socket.emit('joinGame', myPlayerData);

    socket.on('disconnect', () => {
        console.log("disconnected from server");
        if (scene) {
            Object.values(netPlayers).forEach(p => {
                console.log(p);
                scene.removePlayer(p.netId);
                delete netPlayers[p.netId];
            });
        }
    });
    socket.on('currentPlayers', (playerList) => {
        playerList.forEach(element => {
            if (element.netId === socket.id) return;
            console.log(element);
            if (netPlayers[element.netId]) return;
            netPlayers[element.netId] = scene.addPlayer(element.netId, element.data);
        });
    });
    socket.on('newPlayer', ({ netId, data }) => {
        if (netId === socket.id) return;
        netPlayers[netId] = scene.addPlayer(netId, data);
    });
    socket.on('playerDisconnected', (netId) => {
        if (netPlayers[netId]) {
            scene.removePlayer(netId);
            delete netPlayers[netId];
        }
    })
    socket.on('playerPositionUpdate', ({ id, data }) => {
        if (netPlayers[id]) {
            netPlayers[id].targetPos.copy(data.pos);
            netPlayers[id].targetRot = data.rot;
            // netPlayers[id].position.copy(data.pos);
            // netPlayers[id].rotation.y = data.rot;
        }
    });
    socket.on('playerStateUpdate', ({ id, data }) => {
        if (netPlayers[id]) {
            netPlayers[id].setAnimState(data.state);
        }
    });
    socket.on('playerNameUpdate', ({ id, name }) => {
        if (netPlayers[id]) {
            netPlayers[id].setName(name);
            MyEventEmitter.emit('playerNameUpdate', { player: netPlayers[id], name });
        }
    });
    socket.on('chatMessageUpdate', ({ id, data }) => {
        if (netPlayers[id]) {
            MyEventEmitter.emit('chatMessage', { player: data.player, message: data.message, color: 'white' });
        } else if (id === 111) {
            MyEventEmitter.emit('chatMessage', { player: 'Server', message: data.message, color: data.color });
        }
    });
    socket.on('playerHealthUpdate', ({ id, data }) => {
        const { targetId } = data;
        console.log('localSocket: ', socket.id, 'targetSocket: ', targetId, data);
        if (targetId === socket.id) {
            scene.player.applyHealth(data);
        } else if (netPlayers[targetId]) {
            netPlayers[targetId].applyHealth(data);
        }
    });
    socket.on('playerCCUpdate', ({ id, data }) => {
        if (id === socket.id) {
            scene.player.applyCC(data);
        } else if (netPlayers[id]) {
            netPlayers[id].applyCC(data);
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

export function sendChatMessage(player, message) {
    socket.emit("chatMessageSend", { player, message });
}

let lastSentPosition = new Vector3();
let lastSentRotation = 0;
export function tryUpdatePosition({ pos, rot }) {
    if ((lastSentPosition === null || lastSentPosition.distanceToSquared(pos) > 0.001)
        || lastSentRotation !== rot) {
        lastSentPosition.copy(pos);
        lastSentRotation = rot;
        socket.emit("playerPositionSend", { pos: lastSentPosition, rot: lastSentRotation });
    }
}
let lastSentState = 'idle';
export function tryUpdateState(state) {
    if (lastSentState === null || lastSentState !== state) {
        lastSentState = state;
        socket.emit("playerStateSend", { state });
    }
}

export function tryPlayerDamage(actor, amount) {
    socket.emit("playerHealthSend", { targetId: actor.netId, reason: "damage", amount });
}

export function tryApplyCC(actor, cc) {
    socket.emit("playerCCSend", { targetId: actor.netId, ...cc });
}
