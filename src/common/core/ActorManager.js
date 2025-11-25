import SolWorld from "./SolWorld.js";

export default class ActorManager {
    /**
     * 
     * @param {SolWorld} world 
     */
    constructor(world, actorRegistry, client = false) {
        this.world = world;
        this.actorRegistry = actorRegistry;

        this.actors = {
            players: [],
            enemies: [],
            others: []
        }

        this.onNewActor = null;
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
    addActor(actor) {
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
    newActor(type, data) {
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
        const actor = new aClass(this, data);
        if (this.onNewActor) this.onNewActor(actor);
        actor.makeBody?.(this.world.physics);
        group.push(actor);

    }
}