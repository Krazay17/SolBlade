import Actor from "../actors/Actor";

export default class AIRemoteController {
    actor: Actor;
    data: any;
    constructor(actor: Actor, data: any) {
        this.actor = actor;
        this.data = data;
    }
    update(dt: number, time: number) {
        
    }
}