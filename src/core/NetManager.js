import { io } from "socket.io-client";
import MyEventEmitter from "./MyEventEmitter";
import { Vector3 } from "three";
import LocalData from "./LocalData";
import GameScene from "../scenes/GameScene";
import HitData from "./HitData";
import Actor from "../actors/Actor";
import VoiceChat from './VoiceChat';
import TouchData from "./TouchData";

const serverURL = location.hostname === "localhost" ?
    "http://localhost:3000"
    : "solbladeserver-production.up.railway.app";

const socket = io(serverURL, {
    transports: ["websocket"],
    reconnection: false,
    timeout: 5000,
});
export const netSocket = socket;

/**@type {GameScene} */
let scene = null;
let netPlayers = {};
let player = null;
let socketBound = false;
let voiceChat;

socket.on("connect", () => {
    console.log(`I connected with id: ${socket.id}`);
    if (scene) {
        bindSocketEvents();
    }
});

export function setNetScene(newScene) {
    scene = newScene;
    bindSocketEvents();
    voiceChat = new VoiceChat();
    voiceChat.setScene(newScene);
    voiceChat.createButton();
}

function bindSocketEvents() {
    if (socketBound) return;
    socketBound = true;
    if (!scene) return;
    player = scene.player;

    netPlayers[socket.id] = scene.player;

    socket.emit('joinGame', player.serialize());
    socket.on('joinAck', (data) => {
        player.setNetId(data.netId);
    })
    MyEventEmitter.emit('joinGame', player);

    socket.on('disconnect', () => {
        MyEventEmitter.emit('disconnect');
        console.log("disconnected from server");
    });
    socket.on('currentPlayers', (players) => {
        for (const player of Object.values(players)) {
            const playerData = Actor.deserialize(player);
            const { netId } = playerData;
            if (netId === socket.id) continue;
            netPlayers[netId] = scene.pawnManager.spawnPlayer(playerData, true);
        }

        //MyEventEmitter.emit('currentPlayers', players);
    });
    socket.on('newPlayer', (player) => {
        const playerData = Actor.deserialize(player);
        const { netId } = playerData;
        if (netId === socket.id) return;
        netPlayers[netId] = scene.pawnManager.spawnPlayer(playerData, true);

        //MyEventEmitter.emit('newPlayer', { netId, data: playerData });
    });
    socket.on('playerDisconnected', (netId) => {
        if (!netPlayers[netId]) return;
        const player = scene.pawnManager.getPawnById(netId);
        scene.pawnManager.removePawn(player);
        delete netPlayers[netId];

        //MyEventEmitter.emit('dcPlayer', netId);
    });
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
    socket.on('playerNameUpdate', ({ id, name }) => {
        if (netPlayers[id]) {
            netPlayers[id].setName(name);
            MyEventEmitter.emit('playerNameUpdate', { netId: id, player: netPlayers[id], name });
        }
    });
    socket.on('chatMessageUpdate', ({ id, data }) => {
        if (netPlayers[id]) {
            MyEventEmitter.emit('chatMessage', { player: data.player, message: data.message, color: 'white' });
        }
    });
    socket.on('serverMessage', (data) => {
        MyEventEmitter.emit('chatMessage', { player: 'Server', message: data.message, color: data.color });
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
    socket.on('playerParried', ({ id, attacker, health, dmgType }) => {
        if (netPlayers[id]) {
            netPlayers[id].parried(netPlayers[attacker]);
            netPlayers[id].setHealth(health);
            if (dmgType === 'melee') {
                netPlayers[attacker].parried(netPlayers[id]);
            }
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
    socket.on('scoreUpdate', (data) => {
        MyEventEmitter.emit('scoreUpdate', data);
    });
    socket.on('pickupCollected', ({ playerId, netId }) => {
        const pickup = scene.pickupManager.getPickup(netId);
        if (!pickup) return;
        if (socket.id === playerId) {
            pickup.applyCollect(scene.player);
        }
        scene.pickupManager.removePickup(pickup);
    });
    socket.on('crownGameStarted', (players) => {
        MyEventEmitter.emit('crownGameStarted', players);
    });
    socket.on('crownGameEnded', (winner) => {
        MyEventEmitter.emit('crownGameEnded', winner);
    });
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
    });
    socket.on('actorHit', ({ data, health }) => {
        const hit = HitData.deserialize(data, (id) => scene.actorManager.getActorById(id));
        const target = hit.target;
        if (target) {
            target.applyHit(hit, health);
        }
    });
    socket.on('newActor', (data) => {
        const { type, tempId, netId } = data
        const existingActor = scene.actorManager.actors.find(a => a.tempId === tempId);
        if (existingActor) {
            existingActor.setNetId(netId);
        } else {
            const actorData = Actor.deserialize(data, (id) => scene.actorManager.getActorById(id));
            scene.actorManager.spawnActor(type, actorData, true, false);
        }
    });
    socket.on('destroyActor', (id) => {
        const actor = scene.actorManager.getActorById(id)
        if (actor.isRemote) actor.destroy();
    });
    socket.on('actorTouch', data => {
        data = TouchData.deserialize(data, (id) => scene.actorManager.getActorById(id));
        const { dealer, target, active } = data;
        if (dealer && target) {
            target.applyTouch(dealer);
            target.active = active;
        }
    })
}

MyEventEmitter.on('actorTouch', data => {
    socket.emit('actorTouch', data.serialize());
})
MyEventEmitter.on('destroyActor', (data) => {
    socket.emit('destroyActor', data.netId);
})
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
})
MyEventEmitter.on('playerDropItem', (data) => {
    if (socket.connected) {
        socket.emit('playerDropItem', data);
    }
})
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
})
MyEventEmitter.on('fx', (data) => {
    socket.emit('fx', data);
});
MyEventEmitter.on('pickupCollected', (data) => {
    socket.emit('pickupCollected', data);
    if (!socket.connected) {
        data.item.applyCollect(scene.player);
        scene.pickupManager.removePickup(data.item);
    }
});
MyEventEmitter.on('pickupCrown', () => {
    socket.emit('pickupCrown');
});
MyEventEmitter.on('crownGameStart', () => {
    socket.emit('crownGameStart');
});
MyEventEmitter.on('playerDied', ({ player, source }) => {
    source = typeof source === 'string' ? source : source.name || source.netId;
    netSocket.emit('playerDied', { id: player.netId, source });
});
MyEventEmitter.on('bootPlayer', (targetPlayer) => {
    if (LocalData.name !== 'Krazzay') return;
    if (!targetPlayer || !targetPlayer.netId) return;

    socket.emit('bootPlayer', targetPlayer.netId);
});
MyEventEmitter.on('updateParry', (doesParry) => {
    if (player) {
        socket.emit('playerParryUpdate', doesParry);
    }
});
MyEventEmitter.on('playAnimation', (data) => {
    socket.emit('playAnimation', data);
});
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
        socket.emit("playerPositionSend", { pos: lastSentPosition, rot: lastSentRotation });
    }
}
