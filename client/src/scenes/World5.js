import World from "./World";

export default class World5 extends World {
    constructor(game) {
        super(game, 'world5');
    }
    get spawnPos() { return this.getRespawnPoint() }
}