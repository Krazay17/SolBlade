//import { sharedTest } from "../../../shared/Utils";
import Scene from "./Scene";

export default class Scene1 extends Scene {
    constructor(game) {
        super(game, 'scene1');
        //sharedTest();
    }
    get spawnPos() { return this.getRespawnPoint() }
}