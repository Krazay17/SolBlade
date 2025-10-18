import Actor from "../actors/Actor";

export default class TouchData {
    dealer: Actor;
    target: Actor;
    respawn: number;
    destroy: boolean;
    constructor(
        dealer: Actor,
        target: Actor,
        respawn: number = 0,
        destroy: boolean = false,
    ) {
        this.dealer = dealer;
        this.target = target;
        this.respawn = respawn;
        this.destroy = destroy;
    }
    serialize() {
        return {
            dealer: this.dealer.netId,
            target: this.target.netId,
            respawn: this.respawn,
            destroy: this.destroy,
        }
    }
    static deserialize(data: any, getActor: (id: string) => Actor | null) {
        const dealer = data.dealer instanceof Actor ? data.dealer : getActor(data.dealer);
        const target = data.target instanceof Actor ? data.target : getActor(data.target);
        const respawn = data.respawn ?? 0;
        const destroy = data.destroy ?? false;
        return new TouchData(dealer, target, respawn, destroy);
    }
}