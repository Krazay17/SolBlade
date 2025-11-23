import SolWorld from "../core/SolWorld";

export default class ActorManager {
    /**
     * 
     * @param {SolWorld} world 
     */
    constructor(world) {
        this.world = world;

        this.actorRegistry = null;
    }
}