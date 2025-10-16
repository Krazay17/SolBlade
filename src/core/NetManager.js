import { io } from "socket.io-client";
import MyEventEmitter from "./MyEventEmitter";
import { Vector3 } from "three";
import LocalData from "./LocalData";
import HitData from "./HitData";
import Actor from "../actors/Actor";
import VoiceChat from './VoiceChat';
import TouchData from "./TouchData";
import soundPlayer from "./SoundPlayer";
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

socket.on("connect", () => {
    console.log(`I connected with id: ${socket.id}`);
    playerId = socket.id;
    player = Globals.player;
    Globals.player.setNetId(socket.id);
    if (scene) {
        bindSocketEvents();
    }
});

export function setNetScene(newScene) {
    scene = newScene;
    bindSocketEvents();
    voiceChat.setScene(scene);
    socket.emit('newWorld', scene.solWorld);
}

function bindSocketEvents() {
    if (socketBound) return;
    socketBound = true;

    socket.on('disconnect', () => {
        MyEventEmitter.emit('disconnect');
        console.log("disconnected from server");
    });

    const bindGameplay = () => {
        // socket.on('currentPlayers', (players) => {
        //     for (const player of Object.values(players)) {
        //         const playerData = Actor.deserialize(player);
        //         const { netId } = playerData;
        //         if (netId === playerId) continue;
        //         const newPlayer = scene.pawnManager.spawnPlayer(playerData, true);
        //         netPlayers[netId] = newPlayer
        //         MyEventEmitter.emit('playerJoined', newPlayer)
        //     }
        // });
        // socket.on('newPlayer', (player) => {
        //     const playerData = Actor.deserialize(player);
        //     const { netId } = playerData;
        //     if (netId === playerId) return;
        //     const newPlayer = scene.pawnManager.spawnPlayer(playerData, true);
        //     netPlayers[netId] = newPlayer
        //     MyEventEmitter.emit('playerJoined', newPlayer)
        // });
        // socket.on('playerDisconnected', (netId) => {
        //     if (netId === playerId) return;
        //     if (netPlayers[netId]) {
        //         const player = scene.pawnManager.getPawnById(netId);
        //         scene.pawnManager.removePawn(player);
        //         MyEventEmitter.emit('playerLeft', player);
        //         delete netPlayers[netId];
        //     }
        // });
        socket.on('playerDisconnected', (netId) => {
            const player = netPlayers[netId];
            if (!player) return;
            player.destroy();
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
        socket.on('playerAudio', ({ id, data }) => {
            if (id === socket.id) return;
            const { name, pos, url } = data;
            soundPlayer.playPosAudio(name, pos, url);
        });
        socket.on('crownGamePlayers', data => {
            MyEventEmitter.emit('crownGamePlayers', data);
        });
        socket.on('currentActors', (data) => {
            for (const a of data) {
                const { type, tempId, netId } = a
                if (netId === playerId) continue;
                const localActor = scene.actorManager.actors.find(a => a.tempId === tempId);
                if (localActor) {
                    localActor.setNetId(netId);
                } else {
                    const actorData = Actor.deserialize(a, (id) => scene.actorManager.getActorById(id));
                    const newActor = scene.actorManager.spawnActor(type, actorData, true, false);
                    if (type === 'player') netPlayers[netId] = newActor;
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
                if (type === 'player') netPlayers[netId] = newActor;
            }
        });
        socket.on('actorHit', ({ data, health }) => {
            const hit = HitData.deserialize(data, (id) => scene.actorManager.getActorById(id));
            const target = hit.target;
            if (target) {
                target.applyHit(hit, health);
            }
        });
        socket.on('actorTouch', data => {
            data = TouchData.deserialize(data, (id) => scene.actorManager.getActorById(id));
            const target = data.target;
            if (target) {
                target.applyTouch(data);
            }
        });
        socket.on('actorDie', (data) => {
            data = HitData.deserialize(data, (id) => scene.getActorById(id));
            const { dealer, target } = data;
            if (target) target.die?.(data);
        });
        socket.on('playerDied', data => {
            data = HitData.deserialize(data, (id) => scene.getActorById(id));
            MyEventEmitter.emit('playerDied', data);
        })
        socket.on('destroyActor', (id) => {
            const actor = scene.actorManager.getActorById(id);
            if (actor && actor.isRemote) actor.destroy();
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
                voiceChat.voiceMap[netId].gain.gain.value = 0;
                actor.destroy();
            }
            if (!actor && (scene.solWorld === solWorld)) {
                netPlayers[netId] = scene.actorManager.spawnActor(type, data, true, false);
            }
        })

    }
    bindGameplay();

    voiceChat = new VoiceChat();
    voiceChat.createButton();

    socket.emit('joinGame', Globals.player.serialize());

    // socket.on('joinAck', (data) => {
    //     // playerId = data.netId;
    //     // player.setNetId(playerId);
    //     // netPlayers[playerId] = player;
    //     bindGameplay();
    //     socket.emit('bindGameplay');
    //     //socket.emit('requestActors', game.solWorld);
    //     MyEventEmitter.emit('joinGame', player);
    // });
}

MyEventEmitter.on('enterWorld', world => {
    socket.emit('enterWorld', world);
})
MyEventEmitter.on('leaveWorld', (world) => {
    socket.emit('leaveWorld', world);
})
MyEventEmitter.on('playerNameChange', (data) => {
    socket.emit('playerNameChange', data);
})
MyEventEmitter.on('actorStateUpdate', data => {
    socket.emit('actorStateUpdate', data?.serialize?.());
});
MyEventEmitter.on('actorDie', (data) => {
    if (socket.connected) {
        socket.emit('actorDie', data?.serialize?.() || data);
    }
});
MyEventEmitter.on('actorTouch', (/**@type {TouchData}*/data) => {
    if (socket.connected) {
        socket.emit('actorTouch', data.serialize());
    } else {
        data.target.applyTouch(data.dealer);
    }
}
);
MyEventEmitter.on('destroyActor', (data) => {
    socket.emit('destroyActor', data.netId);
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
})
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
})
MyEventEmitter.on('actorHit', (data) => {
    if (socket.connected) {
        socket.emit('actorHit', data.serialize());
    } else {
        data.target.applyHit(data);
    }
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
