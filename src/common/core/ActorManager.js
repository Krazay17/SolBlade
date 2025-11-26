import Actor from "../actors/Actor.js";
import SolWorld from "./SolWorld.js";

export default class ActorManager {
    /**
     * 
     * @param {SolWorld} world 
     */
    constructor(world, actorRegistry) {
        this.world = world;
        this.actorRegistry = actorRegistry;
        this.nextId = 1;

        this.actors = {
            players: [],
            enemies: [],
            others: []
        }

        this.onNewActor = (/**@type {Actor} */ actor) => { };
        this.onStep = null;
    }
    get allActors() {
        const all = [];
        for (const group of Object.values(this.actors)) {
            for (const actor of group) {
                all.push(actor);
            }
        }
        return all;
    }
    tick(dt) {
        for (const a of this.allActors) {
            a.tick(dt);
        }

    }
    getActorById(id) {
        for (const a of this.allActors) {
            if (a.id === id) return a;
        }
    }
    addActor(actor, isRemote = false, replicate = false) {
        let group;
        switch (actor.type) {
            case "player":
                group = this.actors.players;
                break;
            case "enemy":
                group = this.actors.enemies;
                break;
            default:
                group = this.actors.others;
        }
        actor.makeBody?.(this.world.physics);
        group.push(actor);
    }
    newActor(type, data, isRemote = false, replicate = false) {
        let group;
        switch (type) {
            case "player":
                group = this.actors.players;
                break;
            case "enemy":
                group = this.actors.enemies;
                break;
            default:
                group = this.actors.others;
        }
        const aClass = this.actorRegistry[data.subtype].class;
        if (!aClass) return;
        const actor = new aClass(this.world, data);
        this.nextId++;
        actor.id = this.nextId;
        if (this.onNewActor) this.onNewActor(actor);
        actor.makeBody?.(this.world.physics);
        group.push(actor);

        console.log(this.actors);
    }
}