import Actor from "./Actor";

export default class Portal extends Actor {
    init(pos, newScene) {
        this.portalToPos = pos;
        this.portalToScene = newScene;
    }
    update() {
        const player = this.scene.player
        if (!player.isDead) {
            const dist = player.position.distanceToSquared(this.position);
            if (dist < 8) {
                this.scene.player.body.position = {x: this.portalToPos.x, y: this.portalToPos.y + 1, z: this.portalToPos.z};
                if (this.portalToScene) {
                    this.scene.spawnLevel(this.portalToScene);
                }
            }
        }
    }
}