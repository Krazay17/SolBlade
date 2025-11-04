import { Projectile } from "@solblade/shared";
import SvActorManager from "../core/SActorManager.js";

export default class SProjectile extends Projectile {
    constructor(actorManager, data) {
        super(actorManager.physics[data.sceneName], data);
        /**@type {SvActorManager} */
        this.actorManager = actorManager;
    }
}