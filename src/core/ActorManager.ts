import { Vector3 } from "three";
import Actor, { ActorData } from "../actors/Actor";
import ProjectileFireball from "../actors/ProjectileFireball";
import Player from "../player/Player";
import MyEventEmitter from "./MyEventEmitter";
import ItemPickup from "../actors/ItemPickup";
import PowerPickup from "../actors/PowerPickup";
import CrownPickup from "../actors/CrownPickup";
import Game from "../Game";
import LocalData from "./LocalData";

const actorRegistry: Record<string, any> = {
    player: Player,
    fireball: ProjectileFireball,
    item: ItemPickup,
    power: PowerPickup,
    crown: CrownPickup,
}

export default class ActorManager {
    game: Game | null;
    player: Player;
    actors: Actor[];
    constructor(game: Game) {
        this.game = game;
        this.actors = [];
        this.player = this.spawnLocalPlayer();
    }
    destroy() {
        for (const a of this.actors) {
            a.destroy();
        }
        this.actors = [];
    }
    update(dt: number, time: number) {
        for (const a of this.actors) { a.update(dt, time) };
    }
    spawnLocalPlayer() {
        //const solWorld = this.game?.solWorld;
        const actorClass = actorRegistry['player'];
        if (!actorClass) throw console.error('NO PLAYER');

        const player = new actorClass(this.game, { pos: LocalData.position || { x: 0, y: 1, z: 0 }, solWorld: LocalData.solWorld })
        this.actors.push(player as Actor);
        return player;
    }
    spawnActor(
        type: string,
        data: any,
        isRemote: boolean = false,
        replicate: boolean = false,
    ): Actor | undefined | void {
        const solWorld = this.game?.solWorld;
        // if (isRemote && (data.solWorld !== solWorld)) return;
        const finalData = { type, ...data, isRemote, replicate, solWorld, active: true };
        // const existingActor = this.getActorById(data.netId);
        // if (existingActor) return existingActor.activate(finalData);
        const actorClass = actorRegistry[type];
        if (!actorClass) return console.warn(`Unknown actor: ${type}`, data);

        const actor = new actorClass(this.game, finalData);
        if (!actor) return;

        this.actors.push(actor);
        if (!isRemote && replicate) {
            if (type === 'player') {
                MyEventEmitter.emit('newPlayer', actor.serialize());
            } else {
                MyEventEmitter.emit('newActor', actor.serialize());
            }
        }
        return actor;
    }
    clearActors() {
        const actors = this.allButPlayer;
        for (const a of actors) {
            a.destroy();
        }
        this.actors = [this.player as Actor];
    }
    removeActor(actor: Actor | string | undefined = undefined) {
        actor = typeof actor === 'string' ? this.getActorById(actor) : actor;
        if (!actor) return;
        const index = this.actors.indexOf(actor);
        this.actors.splice(index, 1);
    }
    destroyActor(actor: Actor | string | undefined = undefined) {
        actor = typeof actor === 'string' ? this.getActorById(actor) : actor;
        if (!actor) return;
        actor.destroy();
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
    get world() {
        return this.game?.world;
    }
    get players() {
        return this.actors.filter(a => a.actorType === 'player');
    }
    get hostiles() {
        return this.actors.filter(a => a !== this.player && a.active && (a.team === 'A' || (a.team !== this.player.team)));
    }
    get allButPlayer() {
        return this.actors.filter(a => a !== this.player);
    }
}