import { Server } from "socket.io";
import http from "http";
import { sendDiscordMessage } from "./DiscordStuff.js";
import SvActorManager from "./src/SvActorManager.js";
import CrownQuest from "./src/SvCrownQuest.js";

const server = http.createServer();
const PORT = Number(process.env.PORT) || 3000;
const isLocal = PORT === 3000 || process.env.NODE_ENV === 'development';
const origin = isLocal ? 'http://localhost:5173' : "https://solblade.online";

export const io = new Server(server, {
    cors: { origin, methods: ["GET", "POST"] },
    connectTimeout: 5000,
    pingInterval: 10000,
    pingTimeout: 20000,
    cleanupEmptyChildNamespaces: true,
});

/**@type {SvActorManager} */
let actorManager;
/**@type {CrownQuest} */
let crownQuest;
let quests;
let players = {};
let playerSockets = {};

io.on('connection', (socket) => {
    if (socket.bound) return;
    playerSockets[socket.id] = socket;
    socket.bound = true;
    const ip = socket.handshake.address;
    console.log(`New connection from ${ip} with id: ${socket.id}`);

    socket.on("join-voice", () => {
        // tell everyone else to start connecting to this peer
        socket.broadcast.emit("new-peer", socket.id);
    });
    // Tell others a new client joined
    socket.broadcast.emit("new-peer", socket.id);
    // Relay messages to a specific peer
    socket.on("offer", ({ targetId, offer }) => {
        io.to(targetId).emit("offer", { from: socket.id, offer });
    });
    socket.on("answer", ({ targetId, answer }) => {
        io.to(targetId).emit("answer", { from: socket.id, answer });
    });
    socket.on("candidate", ({ targetId, candidate }) => {
        io.to(targetId).emit("candidate", { from: socket.id, candidate });
    });

    socket.on('disconnect', () => {
        socket.broadcast.emit('playerDisconnected', socket.id);
        quests.forEach(q => q.leave(socket.id));
        io.emit('serverMessage', { player: 'Server', message: `Player Disconnected: ${players[socket.id]?.name || 'null'}!`, color: 'red' });
        if (!isLocal && players[socket.id]) sendDiscordMessage(`Player Disconnected: ${players[socket.id].name}!`);
        console.log('user disconnected: ' + socket.id);

        actorManager.removeActor(socket.id);
        delete players[socket.id];
    });

    socket.on('joinGame', (data) => {
        if (players[socket.id]) return;
        const player = actorManager.createActor('player', { ...data, netId: socket.id });
        players[socket.id] = player;
        socket.emit('playersConnected', serializePlayers());
        socket.broadcast.emit('playerConnected', player.serialize())

        const bindGameplay = () => {
            socket.on('newWorld', (solWorld) => {
                actorManager.updateActor(player, { solWorld })
                socket.broadcast.emit('newWorld', player.serialize());
                socket.emit('currentActors', actorManager.getActorsOfWorld(solWorld));
            })

            io.emit('serverMessage', { player: 'Server', message: `Player Connected: ${data.name}!`, color: 'yellow' });
            if (!isLocal) sendDiscordMessage(`Player Connected: ${data.name}!`);

            socket.on('iDied', (data) => {
                const { dealer, target } = data;
                const targetName = actorManager.getActorById(target)?.name || 'The Void';
                const dealerName = actorManager.getActorById(dealer)?.name || 'The Void';
                if (player) {
                    io.emit('serverMessage', { player: 'Server', message: `${targetName} slain by: ${dealerName}`, color: 'orange' });
                    io.emit('playerDied', data);
                }
            });
            socket.on('playerNameChange', name => {
                players[socket.id].name = name;
                io.emit('playerNameChange', { id: socket.id, name });
            });
            socket.on('playerStateUpdate', data => {
                //actorManager.updateActor(data);
                socket.broadcast.emit('playerStateUpdate', data);
            })
            socket.on('playerPositionSend', (data) => {
                if (players[socket.id]) players[socket.id].pos = data.pos;
                socket.broadcast.emit('playerPositionUpdate', { id: socket.id, data });
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
            })
            socket.on('chatMessageSend', ({ player, message, color }) => {
                socket.broadcast.emit('chatMessageUpdate', { id: socket.id, data: { player, message, color } });
            });
            socket.on('parryUpdate', (doesParry) => {
                if (players[socket.id]) {
                    players[socket.id].parry = doesParry;
                }
            });
            // socket.on('playerHealthChange', ({ id, health }) => {
            //     players[id].health = health;
            //     socket.broadcast.emit('playerHealthChange', { id, health });
            // });
            // socket.on('fx', (data) => {
            //     socket.broadcast.emit('fx', data);
            // });
            // socket.on('actorHit', (data) => {
            //     const actor = actorManager.getActorById(data.target);
            //     if (actor) {
            //         if (actor.type === 'player' && !playerHit(actor, data)) return;
            //         if (actor.type === 'enemy' && !enemyHit(actor, data)) return;
            //         actor.health = Math.max(0, Math.min(actor.maxHealth, actor.health + data.amount));
            //         actor.lastHit = data;
            //         io.emit('actorHit', { data, health: actor.health });
            //         if (actor.health <= 0) {
            //             actorManager.actorDie(actor.lastHit);
            //         }
            //     }
            // });
            // socket.on('actorTouch', (data) => {
            //     const actor = actorManager.getActorById(data.target);
            //     if (actor && actor.active) {
            //         io.emit('actorTouch', data);
            //         if (data.die) actorManager.actorDie(data);
            //     }
            // });
            // socket.on('actorDie', (data) => {
            //     actorManager.actorDie(data);
            // });
            socket.on('newActor', (data) => {
                actorManager.createActor(data.type, data);
            });
            socket.on('actorStateUpdate', data => {
                const actor = actorManager.getActorById(data.netId);
                if (actor) {
                    Object.assign(actor, data);
                }
            });
            socket.on('playerAudio', data => {
                socket.broadcast.emit('playerAudio', { id: socket.id, data });
            });
            socket.on('playPosSound', data => {
                socket.broadcast.emit('playPosSound', { map: player.solWorld, data });
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
            socket.on('dropCrown', pos => {
                crownQuest.dropCrown(socket.id, pos);
            })
            socket.on('leaveWorld', (world) => {
                socket.broadcast.emit('leaveWorld', { id: socket.id, world });
            });
            socket.on('bootPlayer', id => {
                if (playerSockets[id]) playerSockets[id].disconnect();
            });
            socket.on('actorEvent', ({ id, event, data }) => {
                const actor = actorManager.getActorById(id);
                if (actor && actor[event]) actor[event](data);
            });
            socket.on('actorHealthChangeLocal', health => {
                const actor = actorManager.getActorById(socket.id);
                if (!actor) return;
                actor.healthC.current = health;
            })
        }
        bindGameplay()

    });
    // player connected
});

function serializePlayers() {
    const data = {}
    for (const [id, p] of Object.entries(players)) {
        data[id] = p.serialize();
    }
    return data;
}

function playerHit(actor, data) {
    const { amount, dealer } = data;
    const dealerActor = actorManager.getActorById(dealer);
    if (amount < 0 && actor.parry) {
        io.emit('playerParried', { target: actor.netId, dealer });
        if (dealerActor.parry) io.emit('playerParried', { target: dealer, dealer: actor.netId })
        return false;
    }
    return true;
}

function enemyHit(actor, data) {
    const { amount, dealer, target } = data;
    const enemy = actorManager.enemies.find(a => a.data.netId === target);
    enemy.hit(data);
    return true;
}

server.listen(PORT, () => {
    actorManager = new SvActorManager(io);
    crownQuest = new CrownQuest(io, actorManager);
    quests = [crownQuest];
});
console.log(`Server is running on port ${PORT}`);