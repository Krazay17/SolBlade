import { sharedTest } from "../../../shared/Utils";
import World from "./World";

export default class World1 extends World {
    constructor(game) {
        super(game, 'world1');
        sharedTest();
    }
    get spawnPos() { return this.getRespawnPoint() }
}