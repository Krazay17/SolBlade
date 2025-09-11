import { io } from "socket.io-client";
import MyEventEmitter from "./MyEventEmitter";
import { Vector3 } from "three";
import Globals from "../utils/Globals";
import LocalData from "./LocalData";

const serverURL = location.hostname === "localhost" ?
    "http://localhost:3000"
    : "solbladeserver-production.up.railway.app";

const socket = io(serverURL, {
});
export const netSocket = socket;

let scene = null;
let netPlayers = {};
let player = null;
let socketBound = false;

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
    Object.values(netPlayers).forEach(p => {
        scene.removePlayer(p.netId);
        delete netPlayers[p.netId];
    });
    if (scene) {
        bindSocketEvents(scene.fullNetSync());
    } else {
        MyEventEmitter.once('netSceneSet', bindSocketEvents);
    }
});

function bindSocketEvents(myPlayerData) {
    if (socketBound) return;
    socketBound = true;
    if (!scene) return;
    lastPlayerData = { ...myPlayerData };
    player = scene.player;
    netPlayers[socket.id] = scene.player;

    socket.emit('joinGame', myPlayerData);
    scene.player.netId = socket.id;
    MyEventEmitter.emit('joinGame', scene.player);

    socket.on('disconnect', () => {
        MyEventEmitter.emit('disconnect');
        console.log("disconnected from server");
        Object.values(netPlayers).forEach(p => {
            if (scene) scene.removePlayer(p.netId);
            delete netPlayers[p.netId];
        });
    });
    socket.on('currentPlayers', (playerList) => {
        MyEventEmitter.emit('currentPlayers', playerList);
        playerList.forEach(element => {
            if (element.netId === socket.id) return;
            if (netPlayers[element.netId]) return;
            netPlayers[element.netId] = scene.addPlayer(element.netId, element.data);
        });
    });
    socket.on('newPlayer', ({ netId, data }) => {
        if (netId === socket.id) return;
        MyEventEmitter.emit('newPlayer', { netId, data });
        netPlayers[netId] = scene.addPlayer(netId, data);
    });
    socket.on('playerDisconnected', (netId) => {
        if (netPlayers[netId]) {
            MyEventEmitter.emit('dcPlayer', netId);
            scene.removePlayer(netId);
            delete netPlayers[netId];
        }
    })
    socket.on('playerPositionUpdate', ({ id, data }) => {
        if (netPlayers[id]) {
            netPlayers[id].targetPos.copy(data.pos);
            netPlayers[id].targetRot = data.rot;
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
            MyEventEmitter.emit('playerNameUpdate', { netId: id, player: netPlayers[id], name });
        }
    });
    socket.on('chatMessageUpdate', ({ id, data }) => {
        if (netPlayers[id]) {
            MyEventEmitter.emit('chatMessage', { player: data.player, message: data.message, color: 'white' });
        } else if (id === 111) {
            MyEventEmitter.emit('chatMessage', { player: 'Server', message: data.message, color: data.color });
        }
    });

    socket.on('playerDamageUpdate', ({ targetId, data }) => {
        if (targetId === socket.id) {
            scene.player.applyDamage(data);
        }
        else if (netPlayers[targetId]) {
            netPlayers[targetId].applyDamage(data);
        }
    });
    socket.on('playerBlockedUpdate', ({ id, blocking, health }) => {
        if (id === socket.id) {
            console.log('blocked');
        } else if (netPlayers[id]) {
            netPlayers[id].setHealth(health);
        }
    });
    socket.on('playerRespawnUpdate', ({ id, data }) => {
        if (netPlayers[id]) {
            netPlayers[id].position.set(data.pos.x, data.pos.y, data.pos.z);
            netPlayers[id].setHealth(data.health);
        }
    });
    socket.on('fx', (data) => {
        MyEventEmitter.emit('netFx', data);
    });

    socket.on('scoreUpdate', (data) => {
        MyEventEmitter.emit('scoreUpdate', data);
    });
    socket.on('currentPickups', (pickupList) => {
        pickupList.forEach(element => {
            if (!element.active) return;
            scene.spawnPickup(element.type, element.position, element.itemId);
        });
    });
    socket.on('spawnPickup', (data) => {
        scene.spawnPickup(data.type, data.position, data.itemId);
    });
    socket.on('pickupCollected', ({ playerId, itemId }) => {
        const pickup = scene.getPickup(itemId);
        if (!pickup) return;
        if (socket.id === playerId) {
            pickup.applyCollect(scene.player);
        }
        scene.removePickup(pickup);
    });
    socket.on('crownGameStarted', (players) => {
        MyEventEmitter.emit('crownGameStarted', players);
    });
    socket.on('crownGameEnded', (winner) => {
        MyEventEmitter.emit('crownGameEnded', winner);
    })
    socket.on('pickupCrown', ({ playerId }) => {
        if (netPlayers[playerId]) {
            netPlayers[playerId].pickupCrown();
        }
    });
    socket.on('dropCrown', ({ playerId }) => {
        if (netPlayers[playerId]) {
            netPlayers[playerId].dropCrown();
        }
    });
    socket.on('crownScoreIncrease', ({ playerId, score }) => {
        MyEventEmitter.emit('crownScoreIncrease', { playerId, score });
    })
}

MyEventEmitter.on('fx', (data) => {
    socket.emit('fx', data);
});
MyEventEmitter.on('pickupCollected', (data) => {
    socket.emit('pickupCollected', data);
});
MyEventEmitter.on('pickupCrown', () => {
    socket.emit('pickupCrown');
});
MyEventEmitter.on('crownGameStart', () => {
    socket.emit('crownGameStart');
});
MyEventEmitter.on('playerDied', ({ player, source }) => {
    switch (source) {
        case 'the void':
            MyEventEmitter.emit('chatMessage', { player: 'Server', message: `${player.name} fell into the void!`, color: 'orange' });
            socket.emit('chatMessageSend', { player: 'Server', message: `${player.name} fell into the void!`, color: 'orange' });
            break;
        default:
            MyEventEmitter.emit('chatMessage', { player: 'Server', message: `${player.name} was slain by ${source}!`, color: 'red' });
            socket.emit('chatMessageSend', { player: 'Server', message: `${player.name} was slain by ${source}!`, color: 'red' });
    }
});
MyEventEmitter.on('bootPlayer', (targetPlayer) => {
    if (LocalData.name !== 'Krazzay') return;
    if (!targetPlayer || !targetPlayer.netId) return;

    socket.emit('bootPlayer', targetPlayer.netId);
});

setInterval(() => {
    socket.emit('heartbeat');
}, 5000);

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
