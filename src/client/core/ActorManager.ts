import { Quaternion, Vector3 } from "three";
import Player from "../player/Player";
import MyEventEmitter from "./MyEventEmitter";
import Game from "../CGame";
import LocalData from "./LocalData";
import ClientActor from "../actors/CActor";
import CFireball from "../actors/CFireball";
import CJulian from "../actors/CJulian";
import CScythe from "../actors/CScythe";
import CPower from "../actors/CPower";
import CCard from "../actors/CCard";

const actorRegistry: Record<string, any> = {
    player: Player,
    fireball: CFireball,
    scythe: CScythe,
    power: CPower,
    card: CCard,
    julian: CJulian,
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
        return this.actors.filter(a => !a.isRemote);
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
        const pos = LocalData.position;
        const rot = LocalData.rotation;
        const player = new actorRegistry['player'](this.game, {
            pos,
            rot,
            sceneName: LocalData.sceneName || 'scene2',
            currentHealth: LocalData.health,
            name: LocalData.name
        });
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
        const sceneName = data.sceneName || this.game?.sceneName;
        const finalType = data?.enemy || type;
        const actorClass = actorRegistry[finalType];
        const finalData = { ...data, type, isRemote, replicate, sceneName, active: true };
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
    addActor(actor: ClientActor) {
        if (!actor) return;
        this.actors.push(actor);
    }
    removeActor(actor: ClientActor | string | undefined = undefined) {
        actor = typeof actor === 'string' ? this.getActorById(actor) : actor;
        if (!actor) return;
        const index = this.actors.indexOf(actor);
        this.actors.splice(index, 1);
    }
    getActorById(id: string) {
        return this.actors.find(a => a.id === id);
    }
    getActiveActors(self: ClientActor, owner: ClientActor) {
        return this.actors.filter(a =>
            a.active &&
            a !== self &&
            !(owner && (a === owner || a.owner === owner))
        );
    }
    getActorsInRange(owner: ClientActor, actor: ClientActor, pos: Vector3, range: number) {
        let inrange = new Map();
        for (const a of this.actors) {
            if (!a.active) continue;
            const dist = a.position.distanceToSquared(pos);
            if ((dist <= range)) {
                if (owner && owner === a.id) continue;
                if (actor && actor === a) continue;
                inrange.set(a, dist);
            }
        }
        return inrange;
    }
}