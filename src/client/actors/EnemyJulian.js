import Enemy from "./Enemy";

export default class EnemyJulian extends Enemy {
    constructor(game, data) {
        super(game, {
            ...data,
            skin: "julian",
        });
    }
}