import { Object3D } from "three";
import GameScene from "../scenes/GameScene";

export default class Actor extends Object3D {
    scene: GameScene;
    constructor(scene: GameScene) {
        super();
        this.scene = scene;
    }
    update(dt: number, time: number) { }
    takeDamage(dealer: Actor, damage: any) { console.log('Actor Took Damage', `${damage.amount ?? undefined}`) }
}