import Actor from "./Actor";
import { spawnParticles } from "./ParticleEmitter";

export default class HitParticles extends Actor {
    constructor(game, data) {
        super(game, data);
        spawnParticles(this.position, 50);
        setTimeout(() => {
            this.destroy()
        }, 2000);
    }
}