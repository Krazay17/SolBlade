import Actor from "../actors/Actor";

export default class TouchData {
    dealer: Actor;
    target: Actor;
    respawn: number;
    constructor(
        dealer: Actor,
        target: Actor,
        respawn: number = 0,
    ) {
        this.dealer = dealer;
        this.target = target;
        this.respawn = respawn;
    }
    serialize() {
        return {
            dealer: this.dealer.netId,
            target: this.target.netId,
            respawn: this.respawn,
        }
    }
    static deserialize(data: any, getActor: (id: string) => Actor | null) {
        const dealer = data.dealer instanceof Actor ? data.dealer : getActor(data.dealer);
        const target = data.target instanceof Actor ? data.target : getActor(data.target);
        const respawn = data.respawn ?? 0;
        return new TouchData(dealer, target, respawn);
    }
}