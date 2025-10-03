import { Object3D } from "three";

export default class Actor extends Object3D {
    constructor() {
        super();
    }
    update(dt: number, time: number) { }
    takeDamage(dealer: Actor, damage: any) { console.log('Actor Took Damage', `${damage.amount ?? undefined}`) }
}