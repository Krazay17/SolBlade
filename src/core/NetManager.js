import { io } from "socket.io-client";
import MyEventEmitter from "./MyEventEmitter";
import { Vector3 } from "three";
import LocalData from "./LocalData";
import HitData from "./HitData";
import Actor from "../actors/Actor";
import VoiceChat from './VoiceChat';
import TouchData from "./TouchData";
import Globals from "../utils/Globals";

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
export let netPlayers = {};
let player = null;
let playerId = null;
let socketBound = false;
let voiceChat;


export function setNetScene(newScene) {
    scene = newScene;
    if (socket.connected && scene) {
        bindSocketEvents();
        if (voiceChat) voiceChat.setScene(scene);
        socket.emit('newWorld', scene.solWorld);
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
        bindSocketEvents();
    }
});
function bindSocketEvents() {
    if (socketBound || !scene) return;
    socketBound = true;

    player = Globals.player;
    Globals.player.setNetId(socket.id);
    netPlayers[socket.id] = player;
    socket.emit('joinGame', Globals.player.serialize());

    voiceChat = new VoiceChat();
    voiceChat.createButton();
    voiceChat.setScene(scene);

    const bindGameplay = () => {
        socket.on('playerDisconnected', (netId) => {
            const player = netPlayers[netId];
            if (!player) return;
            player.destroy();
            MyEventEmitter.emit('playerLeft', player);
        })
        socket.on('playerPositionUpdate', ({ id, data }) => {
            if (netPlayers[id]) {
                netPlayers[id].targetPosition.copy(data.pos);
                netPlayers[id].targetRotation = data.rot;
            }
        });
        socket.on('playAnimation', ({ id, data }) => {
            const player = netPlayers[id];
            if (player) {
                player.animationManager?.playAnimation(data.name, data.loop);
            }
        })
        socket.on('chatMessageUpdate', ({ id, data }) => {
            if (netPlayers[id]) {
                MyEventEmitter.emit('chatMessage', { player: data.player, message: data.message, color: 'white' });
            }
        });
        socket.on('serverMessage', (data) => {
            MyEventEmitter.emit('chatMessage', { player: 'Server', message: data.message, color: data.color });
        });
        socket.on('playerParried', ({ target, dealer }) => {
            if (netPlayers[target] && netPlayers[dealer]) {
                netPlayers[target].parried(netPlayers[dealer]);
            }
        });
        socket.on('playerRespawn', ({ id, health }) => {
            if (netPlayers[id]) {
                netPlayers[id].health = health;
            }
        });
        socket.on('fx', (data) => {
            MyEventEmitter.emit('netFx', data);
        });
        socket.on('crownGamePlayers', data => {
            MyEventEmitter.emit('crownGamePlayers', data);
        });
        socket.on('currentActors', (data) => {
            for (const a of data) {
                const { type, tempId, netId } = a
                if (netId === playerId) continue;
                const localActor = scene.actorManager.actors.find(a => (a.tempId === tempId) || a.netId === netId && a.active);
                if (localActor) {
                    localActor.setNetId(netId);
                } else {
                    const actorData = Actor.deserialize(a, (id) => scene.actorManager.getActorById(id));
                    const newActor = scene.actorManager.spawnActor(type, actorData, true, true);
                    if (type === 'player') {
                        netPlayers[netId] = newActor;
                    }
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
                const newActor = scene.actorManager.spawnActor(type, actorData, true, true);
                if (type === 'player') {
                    netPlayers[netId] = newActor;
                }
            }
        });
        socket.on('playerDied', data => {
            data = HitData.deserialize(data, (id) => scene.getActorById(id));
            MyEventEmitter.emit('playerDied', data);
        });
        socket.on('changeAnimation', ({ id, data }) => {
            if (id === socket.id) return;
            const actor = netPlayers[id];
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
                MyEventEmitter.emit('playerLeft', actor);
            }
            if (!actor && (scene.solWorld === solWorld)) {
                const newPlayer = scene.actorManager.spawnActor(type, data, true, true);
                netPlayers[netId] = newPlayer;
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
        socket.on('actorDestroy', (data) => {
            data = HitData.deserialize(data, (id) => scene.getActorById(id));
            const { dealer, target } = data;
            if (target) target.applyDestroy?.(data);
        });
        socket.on('playPosSound', ({ map, data }) => {
            if (map !== scene.solWorld) return;
            scene.soundPlayer.applyPosSound(data.name, data.pos);
        })
    }
    bindGameplay();
}

MyEventEmitter.on('playPosSound', ({ name, pos }) => {
    socket.emit('playPosSound', { name, pos: { x: pos.x, y: pos.y, z: pos.z } });
})
MyEventEmitter.on('actorHit', (/**@type {HitData}*/data) => {
    if (socket.connected && data.target.replicate) {
        socket.emit('actorHit', data.serialize());
    } else {
        data.target.applyHit(data);
    }
});
MyEventEmitter.on('actorTouch', (/**@type {TouchData}*/data) => {
    if (socket.connected && data.target.replicate) {
        socket.emit('actorTouch', data.serialize());
    } else {
        data.target.applyTouch(data);
    }
});
MyEventEmitter.on('actorDie', (/**@type {HitData}*/data) => {
    if (socket.connected && data.target.replicate) {
        socket.emit('actorDie', data.serialize());
    } else {
        data.target.applyDie(data);
    }
});
MyEventEmitter.on('actorDestroy', (/**@type {Actor}*/data) => {
    if (socket.connected && data.replicate) {
        socket.emit('actorDestroy', data.serialize());
    }
});
MyEventEmitter.on('actorFX', ({ actor, fx }) => {
    if (socket.connected && actor.replicate) {
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
MyEventEmitter.on('actorStateUpdate', data => {
    socket.emit('actorStateUpdate', data?.serialize?.());
});
MyEventEmitter.on('playerRespawn', () => {
    socket.emit('playerRespawn');
});
MyEventEmitter.on('newPlayer', (data) => {
    socket.emit('newPlayer', data);
});
MyEventEmitter.on('newActor', (data) => {
    socket.emit('newActor', data);
});
MyEventEmitter.on('spawnLocations', (data) => {
    socket.emit('spawnLocations', data);
});
MyEventEmitter.on('playerDropItem', (data) => {
    if (socket.connected) socket.emit('playerDropItem', data);
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
