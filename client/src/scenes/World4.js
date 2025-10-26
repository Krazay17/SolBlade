import World from "./World";

export default class World4 extends World {
    constructor(game) {
        super(game, 'world4')
    }
    get spawnPos() { return this.getRespawnPoint() };
}