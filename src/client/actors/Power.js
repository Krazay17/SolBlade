import ClientPickup from "./ClientPickup.js";

export default class Power extends ClientPickup {
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