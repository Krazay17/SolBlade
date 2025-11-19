import { Projectile } from "@solblade/shared";
import SvActorManager from "../core/SActorManager.js";
import HitData from "@solblade/shared/HitData.js";

export default class SProjectile extends Projectile {
    constructor(game, data) {
        super(game.physics[data.sceneName], data);
        this.game = game;
        /**@type {SvActorManager} */
        this.actorManager = game.actorManager;
        
        this.init();
    }
    onCollide(result) {
        super.onCollide()
        this.deActivate()
        // DEACTIVATE IS DESTROYING ON CLIENT FOR NOW
        this.game.io.emit('actorEvent', { id: this.id, event: 'onCollide' });
    }
    onHit(r) {
        super.onHit(r);
        this.deActivate();
        const actor = this.game.getActorById(r);
        actor.hit(new HitData({
            dealer: this.owner,
            target: r,
            amount: this.damage
        }))
    }
}