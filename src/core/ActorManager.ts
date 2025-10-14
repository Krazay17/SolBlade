import { Vector3 } from "three";
import Actor, { ActorData } from "../actors/Actor";
import ProjectileFireball from "../actors/ProjectileFireball";
import Player from "../player/Player";
import GameScene from "../scenes/GameScene";
import MyEventEmitter from "./MyEventEmitter";
import ItemPickup from "../actors/ItemPickup";
import PowerPickup from "../actors/PowerPickup";
import CrownPickup from "../actors/CrownPickup";

const actorRegistry: Record<string, any> = {
    player: Player,
    fireball: ProjectileFireball,
    item: ItemPickup,
    power: PowerPickup,
    crown: CrownPickup,
}

export default class ActorManager {
    scene: GameScene;
    actors: Actor[];
    constructor(scene: GameScene) {
        this.scene = scene;
        this.actors = [];
    }
    destroy() {
        for (const a of this.actors) {
            a.destroy();
        }
    }
    update(dt: number, time: number) {
        for (const a of this.actors) { a.update(dt, time) };
    }
    spawnActor(
        type: string,
        data: any,
        isRemote: boolean = false,
        replicate: boolean = false,
    ): Actor | undefined | void {
        const finalData = { type, ...data, isRemote, replicate };
        // const existingActor = this.getActorById(data.netId);
        // if (existingActor) return existingActor.activate(finalData);
        const actorClass = actorRegistry[type];
        if (!actorClass) return console.warn(`Unknown actor: ${type}`);

        const actor = new actorClass(this.scene, finalData);
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
    removeActor(actor: Actor | string | undefined = undefined) {
        actor = typeof actor === 'string' ? this.getActorById(actor) : actor;
        if (!actor) return;
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
}