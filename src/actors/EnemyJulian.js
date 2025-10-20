import Enemy from "./Enemy";

export default class EnemyJulian extends Enemy {
    constructor(game, data) {
        data.health = 50;
        super(game, data, 'julian', 0.5, 1);

    }
}