import { sendDiscordMessage } from "./core/DiscordStuff.js";
import SActorManager from "./core/SActorManager.js";
import SPhysics from "./core/SPhysics.js";
import SQuestManager from "./core/SQuestManager.js";

export default class SGame {
    constructor(io) {
        this.io = io;

        this.sockets = new Map();
        this.players = {};
        this.actorManager = new SActorManager(this, io);
        this.physics = new SPhysics(this, io);
        this.questManager = new SQuestManager(this, io);
        this.questManager.startCrownQuest();

        this.init();
    }
    get allActors() { return this.actorManager.actors }
    get allPlayersSerialized() {
        const serializedData = {}
        for (const [id, a] of Object.entries(this.players)) {
            if (!a.active) continue;
            serializedData[id] = a.serialize();
        }
        return serializedData;
    }
    init() {
        this.lastTime = performance.now();
        this.accumulator = 0;
        const timestep = 1 / 60;
        this.fixedUpdateTimer = setInterval(() => {
            const now = performance.now();
            const frameTime = Math.min((now - this.lastTime) / 1000, 0.25);
            this.lastTime = now;

            this.accumulator += frameTime;
            while (this.accumulator >= timestep) {
                this.loop(timestep);
                this.accumulator -= timestep;
            }
        }, 1000 / 60);
    }
    createActor(type, data) {
        return this.actorManager.createActor(type, data)
    }
    removeActor(actor) {
        this.actorManager.removeActor(actor);
    }
    loop(dt) {
        this.physics.update(dt);
        this.actorManager.update(dt);
        this.questManager.update(dt);
    }
    userConnect(socket) {
        this.sockets.set(socket.id, socket);
    }
    userDisconnect(id) {
        this.io.emit('serverMessage', { player: 'Server', message: `Player Disconnected: ${this.players[id]?.name || 'null'}!`, color: 'red' });
        if (this.players[id]) sendDiscordMessage(`Player Disconnected: ${this.players[id].name}!`);

        this.actorManager.removeActor(id);
        this.sockets.delete(id);
        delete this.players[id];
    }
    userJoin(socket, data) {
        if (this.players[socket.id]) return;
        const player = this.actorManager.createActor('player', { ...data, id: socket.id });
        this.players[socket.id] = player;
        socket.emit('playersConnected', this.allPlayersSerialized);
        socket.broadcast.emit('playerConnected', player.serialize())

        this.bindGameEvents(socket, player);
    }
    bindGameEvents(socket, player) {
        socket.on('newScene', (scene) => {
            this.actorManager.onNewScene(socket.id, scene)
            socket.broadcast.emit('newScene', player.serialize());
            socket.emit('currentActors', this.actorManager.getActorsOfScene(scene));
        });
        socket.on('checkCurrentActors', (scene) => {
            socket.emit('currentActors', this.actorManager.getActorsOfScene(scene));
        });

        this.io.emit('serverMessage', { player: 'Server', message: `Player Connected: ${player.name}!`, color: 'yellow' });
        sendDiscordMessage(`Player Connected: ${player.name}!`);

        socket.on('iDied', (data) => {
            if (player) { player.die(data); }
        });
        socket.on('spawnFX', (data) => {
            socket.broadcast.emit('spawnFX', data);
        });
        socket.on('playerNameChange', name => {
            this.players[socket.id].name = name;
            this.io.emit('playerNameChange', { id: socket.id, name });
        });
        socket.on('playerStateUpdate', data => {
            socket.broadcast.emit('playerStateUpdate', data);
        });
        socket.on('playerPosition', (data) => {
            if (this.players[socket.id]) this.players[socket.id].pos = data.pos;
            socket.broadcast.emit('playerPosition', { id: socket.id, data });
        });
        socket.on('playerRotation', (data) => {
            if (this.players[socket.id]) this.players[socket.id].rot = data;
            socket.broadcast.emit('playerRotation', { id: socket.id, data });
        });
        socket.on('playAnimation', (data) => {
            if (this.players[socket.id]) this.players[socket.id].anim = data;
            socket.broadcast.emit('playAnimation', { id: socket.id, data })
        });
        socket.on('changeAnimation', (data) => {
            const player = this.players[socket.id];
            if (player) socket.broadcast.emit('changeAnimation', { id: socket.id, data });
        });
        socket.on('chatMessageSend', ({ player, message, color }) => {
            socket.broadcast.emit('chatMessageUpdate', { id: socket.id, data: { player, message, color } });
        });
        socket.on('parryUpdate', (doesParry) => {
            if (this.players[socket.id]) {
                this.players[socket.id].parry = doesParry;
            }
        });
        socket.on('newActor', (data) => {
            this.actorManager.createActor(data.type, data);
        });
        socket.on('actorStateUpdate', (data) => {
            const actor = this.actorManager.getActorById(data.id);
            if (actor) {
                Object.assign(actor, data);
            }
        });
        socket.on('playerAudio', (data) => {
            socket.broadcast.emit('playerAudio', { id: socket.id, data });
        });
        socket.on('playPosSound', (data) => {
            socket.broadcast.emit('playPosSound', { sceneName: player.sceneName, data });
        });
        socket.on('crownGameEnter', () => {
            const quest = this.questManager.getQuest('crown');
            quest.join(socket);
        });
        socket.on('leaveScene', (scene) => {
            socket.broadcast.emit('leavescene', { id: socket.id, scene });
        });
        socket.on('actorEvent', ({ id, event, data }) => {
            console.log(performance.now(), event);
            const actor = this.actorManager.getActorById(id);
            if (actor && actor[event]) actor[event](data);
        });
        socket.on('actorMulticast', (data) => {
            this.io.emit('actorMulticast', data);
        });
        socket.on('actorHealthChangeLocal', health => {
            const actor = this.actorManager.getActorById(socket.id);
            if (!actor) return;
            actor.health.current = health;
        });
        socket.on('meshRotation', data => {
            socket.broadcast.emit('meshRotation', { id: socket.id, data });
        })
        socket.on('weaponSwap', data => {
            socket.broadcast.emit('weaponSwap', { id: socket.id, data });
        })
    }
}