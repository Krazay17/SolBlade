import GameScene from "./GameScene";

export default class World2 extends GameScene {
    constructor(game) {
        super(game, 'world2', { killFloor: -30 });
    }
}