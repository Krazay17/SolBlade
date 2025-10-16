import { PointLight } from "three";
import Game from "../Game";

export default class LightManager {
    constructor(/**@type {Game}*/game) {
        this.game = game;
        this.lights = [];
    }
    spawnLight(data) {
        const { type, pos, color = 'white', intensity } = data;
        let light;
        switch (type) {
            case 'pointLight':
                light = new PointLight(color, intensity);
                break;
        }
        light.position.set(pos.x, pos.y, pos.z);
        this.lights.push(light);
        this.game.add(light);
        return light;
    }
    destroy() {
        for (const light of this.lights) {
            this.game.remove(light);
        }
    }
}