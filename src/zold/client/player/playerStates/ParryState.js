import PlayerState from "./_PlayerState";
import CameraFX from "../../core/CameraFX";
import MyEventEmitter from "../../../../common/core/MyEventEmitter";

export default class ParryState extends PlayerState {
    enter(state, { pos }) {
        this.actor.setParry(true);
        this.startTime = performance.now();
        this.duration = 300;
        this.actor.sleep();
        CameraFX.shake(0.25, 450, .02);
        this.direction = this.actor.position.clone()
            .sub(pos)
            .normalize()
            .multiplyScalar(6);
        this.actor.velocity = { x: 0, y: 0, z: 0 };
        this.actor.sleep();
    }
    update(dt) {
        if (performance.now() > this.startTime + this.duration) {
            this.manager.setState('stun', { duration: 300 });
            return;
        }
    }
    exit() {
        this.actor.animationManager?.changeTimeScale(-.5, 300);
        this.actor.wakeUp();
        this.actor.velocity = { x: this.direction.x, y: this.direction.y, z: this.direction.z };
        this.actor.setParry(false);
        MyEventEmitter.emit('playerParryUpdate', false);
    }

    canExit(state) {
        return performance.now() > this.startTime + this.duration
            || state === 'parry'
            || state === 'dead'
            || state === 'stun';
    }
}