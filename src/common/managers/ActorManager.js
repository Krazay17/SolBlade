import SolWorld from "../core/SolWorld";

export default class ActorManager {
    /**
     * 
     * @param {SolWorld} world 
     */
    constructor(world) {
        this.world = world;
        this.actors = {
            players: [],
            enemies: [],
            others: []
        }
        this.actorRegistry = null;
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
    addActor(type, data) {
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
        const aClass = this.actorRegistry[data.subtype];
        if (!aClass) return;
        const actor = new aClass(this, data);
        actor.makeBody?.(this.world.physics);
        group.push(actor);
    }
}