import { io } from "socket.io-client";
import MyEventEmitter from "./MyEventEmitter";
import { Vector3 } from "three";
import LocalData from "./LocalData";
import HitData from "./HitData";
import Actor from "../actors/Actor";
import VoiceChat from './VoiceChat';
import TouchData from "./TouchData";
import Globals from "../utils/Globals";
import { menuButton } from "../ui/Menu";

const serverURL = location.hostname === "localhost" ?
    "http://localhost:3000"
    : "solbladeserver-production.up.railway.app";

const socket = io(serverURL, {
    transports: ["websocket"],
    reconnection: false,
    timeout: 5000,
});
export const netSocket = socket;

let scene = null;
let netPlayers = {};
let player = null;
let playerId = null;
let socketBound = false;

let voiceChat = new VoiceChat();
voiceChat.createButton();


export function setNetScene(newScene) {
    scene = newScene;
    if (socket.connected && scene) {
        joinGame();
    }
}
socket.on("connect", () => {
    console.log(`I connected with id: ${socket.id}`);
    playerId = socket.id;
    socket.on('disconnect', () => {
        MyEventEmitter.emit('disconnect');
        console.log("disconnected from server");
    });
    if (scene) {
        joinGame();
    }
});
function joinGame() {
    player = Globals.player;
    player.setNetId(playerId);
    netPlayers[playerId] = player;
    initBindings();
    socket.emit('joinGame', player.serialize());
    socket.emit('newWorld', scene.solWorld);
    if (voiceChat) voiceChat.setScene(scene);
}
function initBindings() {
    if (socketBound || !scene) return;
    socketBound = true;

    menuButton('disconnect', () => {
        socket.disconnect();
    });

    socket.on('playerDisconnected', (netId) => {
        if (netId === playerId) return;
        MyEventEmitter.emit('playerDisconnected', netPlayers[netId]);
        delete netPlayers[netId];
        const player = scene.getActorById(netId);
        if (!player) return;
        player.destroy();
    });
    socket.on('playerConnected', player => {
        const { netId } = player;
        if (netId === playerId) return;
        netPlayers[netId] = player;
        MyEventEmitter.emit('playerConnected', player);
    });
    socket.on('playersConnected', players => {
        for (const [netId, player] of Object.entries(players)) {
            if (netId === playerId) return;
            netPlayers[netId] = player
            console.log(netId, player);
            MyEventEmitter.emit('playerConnected', player);
        }
    });
    socket.on('chatMessageUpdate', ({ id, data }) => {
        if (netPlayers[id]) {
            MyEventEmitter.emit('chatMessage', { player: data.player, message: data.message, color: 'white' });
        }
    });
    socket.on('playerHealthChange', ({ id, health }) => {
        netPlayers[id].health = health;
        MyEventEmitter.emit('playerHealthChange', { id, health });
    });
    socket.on('playerPositionUpdate', ({ id, data }) => {
        const player = scene.getActorById(id);
        if (player) {
            player.targetPosition.copy(data.pos);
            player.targetRotation = data.rot;
        }
    });
    socket.on('playAnimation', ({ id, data }) => {
        const player = scene.getActorById(id);
        if (player) {
            player.animationManager?.playAnimation(data.name, data.loop);
        }
    })
    socket.on('serverMessage', (data) => {
        MyEventEmitter.emit('chatMessage', { player: 'Server', message: data.message, color: data.color });
    });
    socket.on('playerParried', ({ target, dealer }) => {
        target = scene.getActorById(target);
        dealer = scene.getActorById(dealer);
        if (target && dealer) {
            target.parried(dealer);
        }
    });
    socket.on('fx', (data) => {
        MyEventEmitter.emit('netFx', data);
    });
    socket.on('crownGamePlayers', data => {
        MyEventEmitter.emit('crownGamePlayers', data);
    });
    socket.on('playerDied', data => {
        data = HitData.deserialize(data, (id) => scene.getActorById(id));
        MyEventEmitter.emit('playerDied', data);
    });
    socket.on('playerRespawn', ({ id, health }) => {
        const player = scene.getActorById(id);
        if (player) player.health = health;
        netPlayers[id].health = health;
    });
    socket.on('changeAnimation', ({ id, data }) => {
        if (id === socket.id) return;
        const actor = scene.getActorById(id);
        if (actor) {
            const { scale, duration } = data;
            actor.animationManager?.changeTimeScale(scale, duration);
        }
    });
    socket.on('playerNameChange', ({ id, name }) => {
        const player = scene.actorManager.getActorById(id);
        if (player) {
            player.setName?.(name);
            MyEventEmitter.emit('playerNameUpdate', ({ player, name }));
        }
    });
    socket.on('newWorld', player => {
        const data = Actor.deserialize(player, (id) => scene.getActorById(id));
        const { type, netId, solWorld } = data;
        const actor = scene.getActorById(netId);
        if (actor && (scene.solWorld !== solWorld)) {
            //voiceChat.voiceMap[netId].gain.gain.value = 0;
            actor.destroy();
        }
        if (!actor && (scene.solWorld === solWorld)) {
            const newPlayer = scene.actorManager.spawnActor(type, data, true, false);
        }
    });
    socket.on('currentActors', (data) => {
        console.log(data);
        for (const a of data) {
            const { type, tempId, netId } = a
            if (netId === playerId) continue;
            const localActor = scene.actorManager.actors.find(a => (a.tempId === tempId) || a.netId === netId && a.active);
            if (localActor) {
                localActor.setNetId(netId);
            } else {
                const actorData = Actor.deserialize(a, (id) => scene.actorManager.getActorById(id));
                const newActor = scene.actorManager.spawnActor(type, actorData, true, false);
            }
        }
    });
    socket.on('newActor', (data) => {
        const { type, tempId, netId, solWorld } = data
        if (netId === playerId) return;
        const existingActor = scene.actorManager.actors.find(a => a.tempId === tempId) || scene.actorManager.actors.find(a => (a.netId === netId) && a.active);
        if (existingActor) {
            existingActor.setNetId(netId);
        } else {
            if (solWorld !== scene.solWorld) return;
            const actorData = Actor.deserialize(data, (id) => scene.actorManager.getActorById(id));
            const newActor = scene.actorManager.spawnActor(type, actorData, true, false);
        }
    });
    socket.on('actorHit', ({ data, health }) => {
        data = HitData.deserialize(data, (id) => scene.getActorById(id));
        const { dealer, target } = data;
        if (target) target.applyHit?.(data, health);
    });
    socket.on('actorTouch', (data) => {
        data = TouchData.deserialize(data, (id) => scene.getActorById(id));
        const { dealer, target } = data;
        if (target) target.applyTouch?.(data);
    });
    socket.on('actorDie', (data) => {
        data = HitData.deserialize(data, (id) => scene.getActorById(id));
        const { dealer, target } = data;
        if (target) target.applyDie?.(data);
    });
    socket.on('playPosSound', ({ map, data }) => {
        if (map !== scene.solWorld) return;
        scene.soundPlayer.applyPosSound(data.name, data.pos);
    });
    socket.on('playerStateUpdate', (data) => {
        const { netId } = data;
        if (netId === playerId) return
        const actor = scene.getActorById(netId);
        if (actor) {
            actor.stateUpdate(data);
        }
    })
}

MyEventEmitter.on('playPosSound', ({ name, pos }) => {
    socket.emit('playPosSound', { name, pos: { x: pos.x, y: pos.y, z: pos.z } });
})
MyEventEmitter.on('actorHit', (/**@type {HitData}*/data) => {
    if (socket.connected) {
        socket.emit('actorHit', data.serialize());
    } else {
        data.target.applyHit(data);
    }
});
MyEventEmitter.on('actorTouch', (/**@type {TouchData}*/data) => {
    if (socket.connected) {
        socket.emit('actorTouch', data.serialize());
    } else {
        data.target.applyTouch(data);
    }
});
MyEventEmitter.on('actorDie', (/**@type {HitData}*/data) => {
    if (socket.connected) {
        socket.emit('actorDie', data.serialize());
    }
    // else {
    //     data.target.applyDie(data);
    // }
});
MyEventEmitter.on('actorFX', ({ actor, fx }) => {
    if (socket.connected) {
        socket.emit('actorFX', { id: actor.netId, fx });
    }
});
MyEventEmitter.on('enterWorld', world => {
    socket.emit('enterWorld', world);
});
MyEventEmitter.on('leaveWorld', (world) => {
    socket.emit('leaveWorld', world);
});
MyEventEmitter.on('playerNameChange', (data) => {
    socket.emit('playerNameChange', data);
});
MyEventEmitter.on('playerStateUpdate', (data) => {
    socket.emit('playerStateUpdate', data?.serialize?.());
})
MyEventEmitter.on('actorStateUpdate', data => {
    socket.emit('actorStateUpdate', data?.serialize?.());
});
MyEventEmitter.on('playerRespawn', () => {
    socket.emit('playerRespawn');
});
MyEventEmitter.on('newPlayer', (data) => {
    socket.emit('newPlayer', data.serialize());
});
MyEventEmitter.on('newActor', (data) => {
    socket.emit('newActor', data.serialize());
});
MyEventEmitter.on('spawnLocations', (data) => {
    socket.emit('spawnLocations', data);
});
MyEventEmitter.on('projectileDestroyed', (data) => {
    socket.emit('projectileDestroyed', data);
});
MyEventEmitter.on('projectileMoved', (data) => {
    socket.emit('projectileMoved', data);
});
MyEventEmitter.on('projectileCreated', (data) => {
    socket.emit('projectileCreated', data);
});
MyEventEmitter.on('takeHealing', (data) => {
    socket.emit('takeHealing', data);
});
MyEventEmitter.on('fx', (data) => {
    socket.emit('fx', data);
});
MyEventEmitter.on('crownPickup', () => {
    socket.emit('crownPickup');
});
MyEventEmitter.on('crownGameStart', () => {
    socket.emit('crownGameStart');
});
MyEventEmitter.on('iDied', (data) => {
    if (socket.connected) {
        netSocket.emit('iDied', data?.serialize?.() || { dealer: { name: 'The Void' }, target: Globals.player.netId });
    }
});
MyEventEmitter.on('bootPlayer', (targetPlayer) => {
    if (LocalData.name !== 'Krazzay') return;
    if (!targetPlayer || !targetPlayer.netId) return;

    socket.emit('bootPlayer', targetPlayer.netId);
});
MyEventEmitter.on('parryUpdate', (doesParry) => {
    if (player) {
        socket.emit('parryUpdate', doesParry);
    }
});
MyEventEmitter.on('playAnimation', (data) => {
    socket.emit('playAnimation', data);
});
MyEventEmitter.on('changeAnimation', (data) => {
    socket.emit('changeAnimation', data);
});

setInterval(() => {
    socket.emit('heartbeat');
}, 5000);

let lastSentPosition = new Vector3();
let lastSentRotation = 0;
export function tryUpdatePosition({ pos, rot }) {
    if ((lastSentPosition === null || lastSentPosition.distanceToSquared(pos) > 0.001)
        || lastSentRotation !== rot) {
        lastSentPosition.copy(pos);
        lastSentRotation = rot;
        socket.emit('playerPositionSend', { pos: lastSentPosition, rot: lastSentRotation });
    }
}
