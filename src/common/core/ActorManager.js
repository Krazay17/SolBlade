import SolWorld from "./SolWorld.js";

export default class ActorManager {
    /**
     * 
     * @param {SolWorld} world 
     */
    constructor(world) {
        this.world = world;
        this.registry = null;
        this.nextId = 1;

        this.actors = {
            players: [],
            enemies: [],
            others: []
        }
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
        const aClass = this.registry[data.subtype].class;
        if (!aClass) return;
        const actor = new aClass(this.world, data);
        this.nextId++;
        actor.id = this.nextId;
        actor.makeBody?.(this.world.physics);
        group.push(actor);

        this.onNewActor(actor);
    }
    onNewActor(actor) { }
}