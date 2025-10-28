import ActorManager from "./ActorManager";

export default class SrvAIController {
    constructor(actor, actorManager) {
        this.actor = actor;
        /**@type {ActorManager} */
        this.actorManager = actorManager;
    }
    update(dt) {
        const players = this.actorManager.playerActors.filter(a=>a.solWorld === this.actor.data.solWorld);
        
    }
}