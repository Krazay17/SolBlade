import Actor from "../actors/Actor";

export default class TouchData {
    dealer: Actor;
    target: Actor;
    active: boolean;
    constructor(
        dealer: Actor,
        target: Actor,
        active: boolean,
    ) {
        this.dealer = dealer;
        this.target = target;
        this.active = active;
    }
    serialize() {
        return {
            dealer: this.dealer.netId,
            target: this.target.netId,
            active: this.active,
        }
    }
    static deserialize(data: any, getActor: (id: string) => Actor | null) {
        const dealer = data.dealer instanceof Actor ? data.dealer : getActor(data.dealer);
        const target = data.target instanceof Actor ? data.target : getActor(data.target);
        const active = data.active ?? undefined;
        return new TouchData(dealer, target, active);
    }
}