import CPickup from "./CPickup.js";

export default class CPower extends CPickup {
    init() {
        let color;
        switch (this.data.power) {
            case 'energy':
                color = "yellow";
                break;
            case "health":
                color = 0x00ff00;
                break;
            default:
                color = 'white';
        }
        this.createMesh(null, color);
        this.createBody(1);
    }
}