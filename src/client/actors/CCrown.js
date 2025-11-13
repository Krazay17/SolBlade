import CPickup from "./CPickup";

export default class CCrown extends CPickup {
    init() {
        this.createMesh("crown");
        this.createBody(1);
    }
}