import Actor from "../actors/Actor.js";
import { Graphics } from "./Graphics.js";
import { World } from "./World.js";

export class CGame {
    constructor() {

        this.world = new World();
        this.graphics = new Graphics(this.world);
        this.physics = 

        this.world.addActor('1', new Actor({name: "player"}));
    }
}