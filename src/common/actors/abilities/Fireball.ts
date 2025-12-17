import { spawnA } from "@solblade/common/core/AFactory";
import Ability from "./Ability";

export class Fireball extends Ability {
    cd = 300;
    use(): boolean {
        if (!super.use()) return false
        const aimPos = this.actor.aim().pos;
        const pos = [aimPos.x, aimPos.y, aimPos.z];
        const ball = spawnA(this.world, "projectile", "server", { pos });
        ball.movement.velocity = this.actor.vecRot.multiplyScalar(25);
        return true
    }
}