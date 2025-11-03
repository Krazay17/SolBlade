import MyEventEmitter from "../core/MyEventEmitter.js";
import ClientActor from "./ClientActor.js";
import RAPIER from "@dimforge/rapier3d-compat";

export default class Power extends ClientActor {
    init() {
        console.log(this.netId)
        let color;
        switch (this.data.power) {
            case 'energy':
                color = "yellow";
                break;
            case "health":
                color = 0x00ff00;
                break;
            default:
                color = 'white';
        }
        this.createMesh(null, color);
        this.createBody(1);
    }
    deActivate() {
        if(!this.active)return;
        if (this.body) {
            this.game.physics.safeRemoveBody(this.body)
        }
        if (this.collider) {
            this.collider.actor = null;
            this.game.physics.safeRemoveCollider(this.collider);
        }
        
        super.deActivate();
    }
    touch(dealer) {
        if (!this.active) return;
        MyEventEmitter.emit('actorEvent', { id: this.netId, event: "touch", data: dealer.netId });
        this.game.soundPlayer.playPosSound('pickup', this.pos);
        this.destroy()
    }
    update(dt, time) {
        if (this.body) this.graphics.position.copy(this.body.translation?.());
    }
    createBody(radius) {
        this.body = this.game.physicsWorld.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased()
            .setTranslation(this.pos.x, this.pos.y, this.pos.z)
        );
        this.collider = this.game.physicsWorld.createCollider(RAPIER.ColliderDesc.ball(radius)
            .setSensor(true),
            this.body
        );
        this.collider.actor = this;
    }
}