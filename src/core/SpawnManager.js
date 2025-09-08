import Pickup from "../actors/Pickup";

export default class SpawnManager {
    constructor(game) {
        this.game = game;
        this.pickupMeshes = [];
    }

    spawnPickup(type, position) {
        const pickup = new Pickup(type, position);
        this.pickupMeshes.push(pickup);
        this.game.graphicsWorld.add(pickup);
    }
}