import SActorManager from "./core/SActorManager";
import SPhysics from "./core/SPhysics";
import SQuestManager from "./core/SQuestManager";

export default class SGame {
    constructor(io) {
        this.io = io;

        this.sockets = new Map();
        this.players = {};

        this.actorManager = new SActorManager(this, io);
        this.physics = new SPhysics(this, io);
        this.questManager = new SQuestManager(this, io);


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
    get allActors() { return this.actorManager.actors }
    createActor(type, data) {
        this.actorManager.createActor(type, data)
    }
    loop(dt) {
        this.physics.update(dt);
        this.actorManager.update(dt);
    }
    userConnect(socket) {
        this.sockets.set(socket.id, socket);
    }
    userDisconnect(id) {
        this.sockets.delete(id);
        this.actorManager.removeActor(id);
    }
    userJoin(socket) {
        this.bindGameEvents(socket);
    }
    bindGameEvents(socket) {
        if (players[socket.id]) return;
        const player = this.actorManager.createActor('player', { ...data, id: socket.id });
        players[socket.id] = player;
        socket.emit('playersConnected', players);
        socket.broadcast.emit('playerConnected', player)

        socket.on('newScene', (scene) => {
            this.actorManager.onNewScene(player, scene)
            socket.broadcast.emit('newScene', player);
            socket.emit('currentActors', this.actorManager.getActorsOfScene(scene));
        });
        socket.on('checkCurrentActors', (scene) => {
            socket.emit('currentActors', this.actorManager.getActorsOfScene(scene));
        });

        io.emit('serverMessage', { player: 'Server', message: `Player Connected: ${data.name}!`, color: 'yellow' });
        if (!isLocal) sendDiscordMessage(`Player Connected: ${data.name}!`);

        socket.on('iDied', (data) => {
            const { dealer, target } = data;
            const targetName = this.actorManager.getActorById(target)?.name || 'The Void';
            const dealerName = this.actorManager.getActorById(dealer)?.name || 'The Void';
            if (player) {
                io.emit('serverMessage', { player: 'Server', message: `${targetName} slain by: ${dealerName}`, color: 'orange' });
                io.emit('playerDied', data);
            }
        });
        socket.on('spawnFX', (data) => {
            socket.broadcast.emit('spawnFX', data);
        });
        socket.on('playerNameChange', name => {
            players[socket.id].name = name;
            io.emit('playerNameChange', { id: socket.id, name });
        });
        socket.on('playerStateUpdate', data => {
            //actorManager.updateActor(data);
            socket.broadcast.emit('playerStateUpdate', data);
        });
        socket.on('playerPositionSend', (data) => {
            if (players[socket.id]) players[socket.id].pos = data.pos;
            socket.broadcast.emit('playerPositionUpdate', { id: socket.id, data });
        });
        socket.on('playerRotation', (data) => {
            //if (players[socket.id]) players[socket.id].rot = data;
            socket.broadcast.emit('playerRotation', { id: socket.id, data });
        });
        socket.on('playAnimation', (data) => {
            if (players[socket.id]) players[socket.id].anim = data;
            socket.broadcast.emit('playAnimation', { id: socket.id, data })
        });
        socket.on('changeAnimation', (data) => {
            const player = players[socket.id];
            if (player) {
                socket.broadcast.emit('changeAnimation', { id: socket.id, data });
            }
        });
        socket.on('chatMessageSend', ({ player, message, color }) => {
            socket.broadcast.emit('chatMessageUpdate', { id: socket.id, data: { player, message, color } });
        });
        socket.on('parryUpdate', (doesParry) => {
            if (players[socket.id]) {
                players[socket.id].parry = doesParry;
            }
        });
        socket.on('newActor', (data) => {
            console.log(data);
            const deserializeData = Actor.deserialize(data);
            console.log(deserializeData);
            this.actorManager.createActor(data.type, deserializeData);
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
        })
        socket.on('crownGameEnter', () => {
            crownQuest.join(socket.id);
        });
        socket.on('crownGameLeave', () => {
            crownQuest.leave(socket.id);
        });
        socket.on('crownPickup', () => {
            crownQuest.pickupCrown(socket.id);
        })
        socket.on('dropCrown', (pos) => {
            crownQuest.dropCrown(socket.id, pos);
        })
        socket.on('leaveScene', (scene) => {
            socket.broadcast.emit('leavescene', { id: socket.id, scene });
        });
        socket.on('bootPlayer', id => {
            if (playerSockets[id]) playerSockets[id].disconnect();
        });
        socket.on('actorEvent', ({ id, event, data }) => {
            console.log(event);
            const actor = this.actorManager.getActorById(id);
            if (actor && actor[event]) actor[event](data);
        });
        socket.on('actorDie', (data) => {
            const actor = this.actorManager.getActorById(data.target);
            if (actor) actor.die(data);
        })
        socket.on('actorHealthChangeLocal', health => {
            const actor = this.actorManager.getActorById(socket.id);
            if (!actor) return;
            actor.health.current = health;
        })
    }
}