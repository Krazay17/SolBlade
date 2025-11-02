import { Vector3 } from "three";
import Actor from "../actors/Actor";

export interface HitDataArgs {
    dealer?: Actor;
    target?: Actor;
    type?: string;
    amount?: number;
    hitPosition?: Vector3 | null;
    impulse?: Vector3 | null;
    stun?: number;
    dim?: number;
    dur?: number;
    critMult?: number;
    sound?: string | null;
}

export default class HitData implements HitDataArgs {
    dealer: Actor | undefined;
    target: Actor | undefined;
    type: string = "physical";
    amount: number = 0;
    dur: number = 0;
    hitPosition: Vector3 | null = null;
    impulse: Vector3 | null = null;
    critMult: number = 1;
    stun: number = 0;
    dim: number = 0;
    sound: string | null;

    constructor({
        dealer,
        target,
        type = "physical",
        amount = 0,
        hitPosition = null,
        impulse = null,
        stun = 0,
        dim = 0,
        dur = 0,
        critMult = 1,
        sound = null,
    }: HitDataArgs = {}) {
        this.dealer = dealer;
        this.target = target;
        this.type = type;
        this.amount = amount;
        this.hitPosition = hitPosition;
        this.impulse = impulse;
        this.stun = stun;
        this.dim = dim;
        this.dur = dur;
        this.critMult = critMult;
        this.sound = sound;
    }

    serialize() {
        const data: any = {};
        for (const [key, value] of Object.entries(this)) {
            if (value === null || value === undefined) continue;
            if (typeof value === "boolean" && value === false) continue;
            if (typeof value === "number" && value === 0 && key !== "amount") continue;

            if (value instanceof Actor) data[key] = value.netId;
            else if (value instanceof Vector3) data[key] = [value.x, value.y, value.z];
            else data[key] = value;
        }
        return data;
    }

    static deserialize(data: any, actorLookup: (id: string) => Actor | null) {
        return new HitData({
            dealer: actorLookup(data.dealer) ?? data.dealer,
            target: actorLookup(data.target) ?? data.target,
            type: data.type ?? "physical",
            amount: data.amount ?? 0,
            hitPosition: data.hitPosition ? new Vector3(...data.hitPosition) : null,
            impulse: data.impulse ? new Vector3(...data.impulse) : null,
            stun: data.stun ?? 0,
            dim: data.dim ?? 0,
            dur: data.dur ?? 0,
            critMult: data.critMult ?? 1,
            sound: data.sound ?? null,
        });
    }
}
