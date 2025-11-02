import Enemy from "./Enemy";

export default class EnemyJulian extends Enemy {
    constructor(game, data) {
        data.skin = 'julian'
        super(game, data);
    }
}