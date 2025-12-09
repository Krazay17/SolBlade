import { Vector3 } from "three";

export default class Controller {
    direction: Vector3 = new Vector3();
    actionStates;
    inputDirection(): Vector3 | boolean { return this.direction }
    aim() { return { dir: null, camDir: null } }
    update(dt: number) { }
    look(y, p){}
}