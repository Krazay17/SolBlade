import { triMeshFromVerts } from "@solblade/shared";
import ClientActor from "./ClientActor";
import RAPIER from "@dimforge/rapier3d-compat";
import MyEventEmitter from "../core/MyEventEmitter";

export default class ClientPickup extends ClientActor {
    createBody(radius, geom) {
        if (this.body || this.collider) return;
        this.body = this.game.physicsWorld.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased()
            .setTranslation(this.pos.x, this.pos.y, this.pos.z)
        );
        let desc;
        if (geom) {
            desc = triMeshFromVerts(geom)
        } else {
            desc = RAPIER.ColliderDesc.ball(radius)
        }
        if (!desc) return;
        this.collider = this.game.physicsWorld.createCollider(desc
            .setSensor(true),
            this.body
        );
        this.collider.actor = this.id;
    }
    hit(data) {
        super.hit(data)

        this.destroy();
    }
    touch(dealer) {
        if (!this.active) return;
        MyEventEmitter.emit('actorEvent', { id: this.id, event: "touch", data: dealer });
        this.game.soundPlayer.playPosSound('pickup', this.pos);

        this.destroy()
    }
}