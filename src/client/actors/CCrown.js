import CPickup from "./CPickup";

export default class CCrown extends CPickup {
    init() {
        this.createMesh("crown").then((m)=>m.scale.set(.8, .8, .8))
        this.createBody(1);
    }
}