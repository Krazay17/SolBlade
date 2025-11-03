import { Vector3 } from "three";
import ClientActor from "../actors/ClientActor";
import ProjectileFireball from "../actors/ProjectileFireball";
import Player from "../player/Player";
import MyEventEmitter from "./MyEventEmitter";
import ItemPickup from "../actors/ItemPickup";
import PowerPickup from "../actors/PowerPickup";
import CrownPickup from "../actors/CrownPickup";
import Game from "../Game";
import LocalData from "./LocalData";
import EnemyJulian from "../actors/EnemyJulian";
import ProjectileScythe from "../actors/ProjectileScythe";

const actorRegistry: Record<string, any> = {
    player: Player,
    fireball: ProjectileFireball,
    item: ItemPickup,
    power: PowerPickup,
    crown: CrownPickup,
    julian: EnemyJulian,
    projectileScythe: ProjectileScythe,
}

export default class ActorManager {
    game: Game | null;
    player: Player;
    actors: ClientActor[];
    constructor(game: Game) {
        this.game = game;
        this.actors = [];
        this.player = this.spawnLocalPlayer();
    }
    get world() {
        return this.game?.world;
    }
    get players() {
        return this.actors.filter(a => a.type === 'player');
    }
    get hostiles() {
        return this.actors.filter(a => a.active && (a !== this.player));
    }
    get allButPlayer() {
        return this.actors.filter(a => a !== this.player);
    }
    get localActors() {
        return this.actors.filter(a => !a.isRemote && a.replicate);
    }
    get remoteActors() { return this.actors.filter(a => a.isRemote) };
    destroy() {
        for (const a of this.actors) {
            a.destroy();
        }
        this.actors = [];
    }
    update(dt: number, time: number) {
        for (const a of this.actors) { a.update?.(dt, time) };
    }
    fixedUpdate(dt: number, time: number) {
        for (const a of this.actors) { a.fixedUpdate?.(dt, time) };
    }
    spawnLocalPlayer() {
        const pos = LocalData.position ? new Vector3().copy(LocalData.position) : new Vector3(0, 1, 0);
        const player = new actorRegistry['player'](this.game, { pos, solWorld: LocalData.solWorld || 'world2' },

        )
        player.body.sleep();
        this.actors.push(player);
        return player;
    }
    spawnActor(
        type: string,
        data: any,
        isRemote: boolean = false,
        replicate: boolean = false,
    ): ClientActor | undefined | void {
        const solWorld = data.solWorld || this.game?.solWorld;
        // if (isRemote && (data.solWorld !== solWorld)) return;
        const finalData = { type, ...data, isRemote, replicate, solWorld, active: true };
        // const existingActor = this.getActorById(data.netId);
        // if (existingActor) return existingActor.activate(finalData);
        const finalType = data?.enemy || type;
        const actorClass = actorRegistry[finalType];
        if (!actorClass) return console.warn(`Unknown actor: ${type}`, data);

        const actor = new actorClass(this.game, finalData);
        if (!actor) return;

        this.actors.push(actor);
        if (!isRemote && replicate) {
            if (type === 'player') {
                MyEventEmitter.emit('newPlayer', actor);
            } else {
                MyEventEmitter.emit('newActor', actor);
            }
        }
        return actor;
    }
    clearActors() {
        const actors = this.allButPlayer;
        for (const a of actors) {
            a.destroy();
        }
        this.actors = [this.player];
        //this.actors.length = 0;
    }
    clearRemoteActors() {
        for (const a of this.remoteActors) {
            a.destroy();
        }
    }
    addActor(actor: Actor) {
        if (!actor) return;
        this.actors.push(actor);
    }
    removeActor(actor: Actor | string | undefined = undefined) {
        actor = typeof actor === 'string' ? this.getActorById(actor) : actor;
        if (!actor) return;
        const index = this.actors.indexOf(actor);
        this.actors.splice(index, 1);
    }
    getActorById(id: string) {
        return this.actors.find(a => a.netId === id);
    }
    getActiveActors(self: Actor, owner: Actor) {
        return this.actors.filter(a =>
            a.active &&
            a !== self &&
            !(owner && (a === owner || a.owner === owner))
        );
    }
    getActorsInRange(owner: Actor, actor: Actor, pos: Vector3, range: number) {
        let inrange = new Map();
        for (const a of this.actors) {
            if (!a.active) continue;
            const dist = a.position.distanceToSquared(pos);
            if ((dist <= range)) {
                if (owner && owner === a) continue;
                if (actor && actor === a) continue;
                inrange.set(a, dist);
            }
        }
        return inrange;
    }
}