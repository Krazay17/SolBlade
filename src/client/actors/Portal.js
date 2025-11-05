import ClientActor from "./ClientActor";

export default class Portal extends ClientActor {
    init(newWorld, targetPos) {
        this.newWorld = newWorld;
        this.game.actorManager.addActor(this);
    }
    update() {
        const player = this.game.player
        if (!player.isDead) {
            const dist = player.position.distanceToSquared(this.position);
            if (dist < 15) {
                if (this.newWorld) {
                    this.game.setScene(this.newWorld);
                }
            }
        }
    }
}