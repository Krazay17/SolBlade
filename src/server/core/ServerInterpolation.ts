import { Actor } from "@solblade/common/actors/Actor";

export class ServerInterpolation {
    actor: Actor;
    isRemote: boolean;
    constructor(actor: Actor, isRemote: boolean = false) {
        this.actor = actor;
        this.isRemote = isRemote;
    }
    tick(dt) {
        if (!this.actor.body) return;
        if (!this.isRemote) {
            const posTo = this.actor.body.translation();
            const rotTo = this.actor.body.rotation();
            this.actor.vecPos = posTo;
            this.actor.quatRot = rotTo;
        } else {
            this.actor.body.setTranslation(this.actor.vecPos, true);
            this.actor.body.setRotation(this.actor.quatRot, true);
        }
    }
}