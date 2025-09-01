import PlayerState from "./_PlayerState";

export default class StunState extends PlayerState {
    enter({ type, dir }) {
        this.timer = performance.now() + 800;
        this.actor.animator?.setAnimState(type);
    }
    update(dt) {
        if (this.timer > performance.now()) return;
        this.manager.setState('idle');
        return;
    }

    canExit() {
        return this.timer < performance.now();
    }
}