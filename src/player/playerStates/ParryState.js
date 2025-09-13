import PlayerState from "./_PlayerState";
import CameraFX from "../../core/CameraFX";
import MyEventEmitter from "../../core/MyEventEmitter";
import { toVector3 } from "../../utils/Utils";

export default class ParryState extends PlayerState {
    enter({ pos }) {
        this.actor.setParry(true);
        MyEventEmitter.emit('playerParryUpdate', true);
        this.startTime = performance.now();
        this.duration = 300;
        this.actor.body.sleep();
        CameraFX.shake(0.25, 450, .02);
        this.direction = this.actor.position.clone()
            .sub(toVector3(pos))
            .normalize()
            .multiplyScalar(6);
        this.actor.body.velocity.set(0, 0, 0);
        this.actor.body.sleep();
    }
    update(dt) {
        if (performance.now() > this.startTime + this.duration) {

            this.manager.setState('stun', { duration: 300 });
            return;
        }
    }
    exit() {
        this.animator?.hitFreeze(300, -.4, 1);
        this.actor.body.wakeUp();
        this.actor.body.velocity.set(this.direction.x, this.direction.y, this.direction.z);
        this.actor.setParry(false);
        MyEventEmitter.emit('playerParryUpdate', false);
        this.actor.body.wakeUp();
    }
}