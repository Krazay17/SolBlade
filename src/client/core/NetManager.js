import { io } from "socket.io-client";
import MyEventEmitter from "./MyEventEmitter";
import { Quaternion, Vector3 } from "three";
import LocalData from "./LocalData";
import HitData from "./HitData";
import VoiceChat from './VoiceChat';
import { menuButton } from "../ui/Menu";
import Game from "../CGame";
import Player from "../player/Player";
import CGame from "../CGame";
import Scene from "../scenes/Scene";

// "solbladeserver-production.up.railway.app";
const serverURL = location.hostname === "localhost"
    ? "localhost:8080"
    : "srv.solblade.online";

const socket = io(serverURL, {
    transports: ["websocket"],
    reconnection: true,
    timeout: 5000,
});
export const netSocket = socket;

/**@type {CGame} */
let game = null;
/**@type {Scene} */
let scene = null;
let netPlayers = {};
/**@type {Player} */
let player = null;
let playerId = null;
let socketBound = false;
let serverVersion = null;

let voiceChat = new VoiceChat();
voiceChat.createButton();
menuButton('Connect', () => {
    socket.connect();
});
menuButton('Disconnect', () => {
    socket.disconnect();
});

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
        if (netPlayers[playerId]) delete netPlayers[playerId]
    });
    socket.on('serverVersion', version => {
        if (serverVersion && (serverVersion !== version)) {
            location.reload();
        }
        serverVersion = version;
    });
    if (scene) {
        joinGame();
    }
});
function joinGame() {
    player = Game.getGame().player;
    player.setId(playerId);
    netPlayers[playerId] = player;
    initBindings();
    socket.emit('joinGame', player.serialize());


    socket.emit('newScene', scene.sceneName);
    if (voiceChat) voiceChat.setScene(scene);
}
function initBindings() {
    if (socketBound || !scene) return;
    socketBound = true;
    game = Game.getGame();

    socket.on('userDisconnected', (id) => {
        if (id === playerId) return;
        MyEventEmitter.emit('playerDisconnected', id);
        delete netPlayers[id];
        const player = scene.getActorById(id);
        if (!player) return;
        player.destroy();
    });
    socket.on('playerConnected', player => {
        const { id } = player;
        if (id === playerId) return;
        netPlayers[id] = player;
        MyEventEmitter.emit('playerConnected', player);
    });
    socket.on('playersConnected', players => {
        for (const [id, player] of Object.entries(players)) {
            if (id === playerId) return;
            netPlayers[id] = player
            MyEventEmitter.emit('playerConnected', player);
        }
    });
    socket.on('chatMessageUpdate', ({ id, data }) => {
        if (netPlayers[id]) {
            MyEventEmitter.emit('chatMessage', { player: data.player, message: data.message, color: 'white' });
        }
    });
    socket.on('playerHealthChange', ({ id, health }) => {
        const player = scene.getActorById(id);
        if (!player) return;
        player.health = health;
    });
    socket.on('playerPosition', ({ id, data }) => {
        if (id === playerId) return;
        const player = scene.getActorById(id);
        if (player) {
            player.pos.copy(data.pos);
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
    socket.on('playerDied', (data) => {
        if (data.target === playerId) player.die();
        if (data) data = HitData.deserialize(data, (id) => scene.getActorById(id));
        MyEventEmitter.emit('playerDied', data);
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
            MyEventEmitter.emit('playerNameUpdate', ({ id, name }));
        }
    });
    socket.on('newScene', (data) => {
        const { type, id, sceneName } = data;
        if (id === playerId) return;
        const actor = scene.getActorById(id);
        if (actor && (scene.sceneName !== sceneName)) {
            actor.destroy();
        }
        if (!actor && (scene.sceneName === sceneName)) {
            const newPlayer = scene.actorManager.spawnActor(type, data, true, false);
        }
    });
    socket.on('currentActors', (data) => {
        for (const a of data) {
            const { type, tempId, id } = a
            if (id === playerId) continue;
            const existingActor = scene.actorManager.actors.find(a =>
                a.active && (a.tempId === tempId || a.id === id)
            );
            if (existingActor) {
                existingActor.setId(id);
                //existingActor.activate();
            } else {
                const newActor = scene.actorManager.spawnActor(type, a, true, false);
            }
        }
    });
    socket.on('newActor', (data) => {
        const { type, tempId, id, sceneName } = data
        if (id === playerId) return;
        console.log(id);
        const existingActor = scene.actorManager.actors.find(a =>
            a.active && (a.tempId === tempId || a.id === id)
        );
        if (existingActor) {
            existingActor.setId(id);
            //existingActor.activate(data);
        } else {
            if (sceneName !== scene.sceneName) return;
            const newActor = scene.actorManager.spawnActor(type, data, true, false);
        }
    });
    socket.on('actorHit', (data) => {
        data = HitData.deserialize(data, (id) => scene.getActorById(id));
        const { dealer, target } = data;
        if (target) target.applyHit?.(data);
    });
    socket.on('playPosSound', ({ sceneName, data }) => {
        if (sceneName !== scene.sceneName) return;
        scene.soundPlayer.applyPosSound(data.name, data.pos);
    });
    socket.on('playerStateUpdate', (data) => {
        const { id } = data;
        if (id === playerId) return;
        const actor = scene.getActorById(id);
        if (actor) {
            actor.stateUpdate(data);
        }
    });
    socket.on('worldUpdate', (enemyBuffer, otherBuffer) => {
        const data = new Float32Array(enemyBuffer);
        const data2 = new Float32Array(otherBuffer);

        for (let i = 0; i < data.length; i += 8) {
            const actor = scene.getActorById(data[i]);
            if (!actor) return;
            actor.pos = new Vector3(data[i + 1], data[i + 2], data[i + 3]);
            actor.rot = new Quaternion(data[i + 4], data[i + 5], data[i + 6], data[i + 7])
        }
        for (let i = 0; i < data2.length; i += 8) {
            const actor = scene.getActorById(data2[i]);
            if (!actor) return;
            actor.pos = new Vector3(data2[i + 1], data2[i + 2], data2[i + 3]);
            actor.rot = new Quaternion(data2[i + 4], data2[i + 5], data2[i + 6], data2[i + 7])
        }
    });
    // socket.on('worldUpdate', ({ enemyPositions, otherPositions }) => {
    //     for (const a of enemyPositions) {
    //         const actor = scene.getActorById(a.id);
    //         if (!actor) return;
    //         actor.pos = convertVector(a.pos);
    //         actor.rot = convertQuat(a.rot);
    //     }
    //     for (const a of otherPositions) {
    //         const actor = scene.getActorById(a.id);
    //         if (!actor) return;
    //         actor.pos = convertVector(a.pos);
    //         actor.rot = convertQuat(a.rot);
    //     }
    // });
    socket.on('actorHealthChange', ({ id, health }) => {
        const actor = scene.getActorById(id);
        if (actor) actor.health.current = health;
    });
    socket.on('actorEvent', ({ id, event, data }) => {
        console.log(event, data);
        const actor = scene.getActorById(id);
        if (actor && actor.active && actor[event]) actor[event](data);
    });
    socket.on('actorMulticast', ({ id, event, data }) => {
        const actor = scene.getActorById(id);
        if (actor && actor.active && actor[event]) actor[event](data);
    });
    socket.on('spawnFX', ({ type, data }) => {
        game.fxManager.spawnFX(type, data, false);
    });
    socket.on('playerRotation', ({ id, data }) => {
        const actor = scene.getActorById(id);
        if (actor) actor.rot.copy(data);
    });
    socket.on('addCard', data => {
        game.inventory.aquireItem(data);
    });
    socket.on('questEvent', ({ quest, event, data }) => {
        quest = game.questManager.hasQuest(quest);
        if (quest && quest[event]) { quest[event](data) }
    });
    socket.on('meshRotation', ({ id, data }) => {
        if (id === playerId) return;
        const actor = game.getActorById(id);
        if (actor) {
            actor.meshRot = data;
        }
    });
    socket.on('weaponSwap', ({ id, data }) => {
        if (id === playerId) return;
        const actor = game.getActorById(id);
        if (actor) actor.setWeapon(data.slot, data.weaponName);
    })
}

MyEventEmitter.on('weaponSwap', data => {
    socket.emit('weaponSwap', data);
})
MyEventEmitter.on('meshRotation', data => {
    socket.emit('meshRotation', data);
})
MyEventEmitter.on('questEvent', (data) => {
    socket.emit('questEvent', data);
})
MyEventEmitter.on('actorMulticast', (data) => {
    socket.emit('actorMulticast', data);
})
MyEventEmitter.on('playerRotation', (data) => {
    socket.emit('playerRotation', data);
})
MyEventEmitter.on('spawnFX', (data) => {
    if (socket.connected) {
        socket.emit('spawnFX', data);
    }
})
MyEventEmitter.on('actorHealthChangeLocal', health => {
    socket.emit('actorHealthChangeLocal', health);
})
MyEventEmitter.on('playerHealthChange', (data) => {
    socket.emit('playerHealthChange', data);
})
MyEventEmitter.on('playPosSound', ({ name, pos }) => {
    socket.emit('playPosSound', { name, pos: { x: pos.x, y: pos.y, z: pos.z } });
})
MyEventEmitter.on('actorEvent', (data) => {
    if (!socket.connected) return;
    socket.emit('actorEvent', data);
})
MyEventEmitter.on('enterScene', (scene) => {
    socket.emit('enterScene', scene);
});
MyEventEmitter.on('leaveScene', (scene) => {
    socket.emit('leaveScene', scene);
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
MyEventEmitter.on('newPlayer', (data) => {
    socket.emit('newPlayer', data.serialize());
});
MyEventEmitter.on('newActor', (data) => {
    socket.emit('newActor', data.serialize());
});
MyEventEmitter.on('spawnLocations', (data) => {
    socket.emit('spawnLocations', data);
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
        netSocket.emit('iDied', data?.serialize?.() || { dealer: { name: 'The Void' }, target: playerId });
    }

});
MyEventEmitter.on('bootPlayer', (targetPlayer) => {
    if (LocalData.name !== 'Krazzay') return;
    if (!targetPlayer || !targetPlayer.id) return;

    socket.emit('bootPlayer', targetPlayer.id);
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

// const pollSceneActors = setInterval(() => {
//     socket.emit('checkCurrentActors', scene.sceneName);
// }, 5000)

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
        socket.emit('playerPosition', { pos: lastSentPosition, rot: lastSentRotation });
    }
}



export default class NetManager {
    constructor(game) {
        /**@type {Game} */
        this.game = game;
        this.scene = this.game.scene;
        this.player = this.game.player;
        this.netPlayers = {};
        this.playerId = '';

        this.socket = io(serverURL, {
            transports: ["websocket"],
            reconnection: true,
            timeout: 5000,
        });

        this.voiceChat = new VoiceChat(this.socket);
        voiceChat.createButton();

        this.game.onSceneChange = (scene) => this.sceneChange(scene);
    }
    sceneChange(scene) {
        console.log('net scene change', scene);
    }
}

function convertVector(v) {
    const vec = Array.isArray(v)
        ? new Vector3(v[0] || 0, v[1] || 0, v[2] || 0)
        : new Vector3(v?.x || 0, v?.y || 0, v?.z || 0);
    return vec;
}
function convertQuat(v) {
    const rot = Array.isArray(v)
        ? new Quaternion(v[0] || 0, v[1] || 0, v[2] || 0, v[3] || 1)
        : new Quaternion(v?.x || 0, v?.y || 0, v?.z || 0, v?.w || 1);
    return rot;
}