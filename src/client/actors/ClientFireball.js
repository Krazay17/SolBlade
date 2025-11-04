import { Projectile } from "@solblade/shared";
import { Object3D } from "three";

export default class ClientFireball extends Projectile {
    constructor(game, data) {
        super(game.physicsWorld, {
            ...data,
            type: 'fireball',
        });

        this.game = game;
        this.graphics = new Object3D()
        this.game.graphics.add(this.graphics);
    }
    deActivate() {
        this.game.graphics.remove(this.graphics);
        this.active = false;
    }
}