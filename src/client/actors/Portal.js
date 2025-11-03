import Actor from "../deprecated/Actor";

export default class Portal extends Actor {
    init(pos, newWorld) {
        this.portalToPos = pos;
        this.newWorld = newWorld;
        this.game.actorManager.addActor(this);
    }
    update() {
        const player = this.game.player
        if (!player.isDead) {
            const dist = player.position.distanceToSquared(this.position);
            if (dist < 15) {
                if (this.newWorld) {
                    this.game.setWorld(this.newWorld, this.portalToPos);
                }
            }
        }
    }
}