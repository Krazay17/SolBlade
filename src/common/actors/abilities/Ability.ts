import SolWorld from "@solblade/common/core/SolWorld";
import { Actor } from "../Actor";


export default class Ability {
    actor: Actor;
    world: SolWorld;
    cd = 0;
    duration = 1000;
    lastuse = -Infinity;
    constructor(actor: Actor) {
        this.actor = actor;
        this.world = actor.world;
    }
    get readyPercent(): number {
        if (this.lastuse === -Infinity) return 1;
        const elapsed = performance.now() - this.lastuse;
        return Math.min(elapsed / this.cd, 1);
    }
    use() {
        const now = performance.now();
        if (this.lastuse + this.cd >= now) return false;
        this.lastuse = performance.now();
        return true;
    }
    tick(dt: number) { }
    end() { }
}