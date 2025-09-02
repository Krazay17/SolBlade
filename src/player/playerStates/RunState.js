import PlayerState from "./_PlayerState";

export default class RunState extends PlayerState {
    constructor(actor, manager, options = {}) {
        super(actor, manager, options);
    }
    enter() {
        this.actor.animator?.setAnimState('run');
    }
    update(dt) {
        this.actor.movement.groundMove(dt);

        let strafe = true;
        // Jump
        if (this.input.keys['Space']) {
            this.manager.setState('jump');
            return;
        }
        if (this.input.actionStates.dash) {
            this.manager.setState('dash')
            return;
        }
        if (this.input.actionStates.blade) {
            this.manager.setState('blade');
            return;
        }
        if (this.input.keys['KeyW']) {
            strafe = false;
            this.actor.animator?.setAnimState('run');
        }
        if (this.input.keys['KeyS']) {
            strafe = false;
            this.actor.animator?.setAnimState('run');
        }
        if (this.input.keys['KeyA']) {
            if (strafe) {
                this.actor.animator?.setAnimState('strafeLeft');
            }
        }
        if (this.input.keys['KeyD']) {
            if (strafe) {
                this.actor.animator?.setAnimState('strafeRight');
            }
        }

        if (!this.actor.groundChecker.isGrounded()) {
            this.manager.setState('fall');
            return;
        }
        // If no movement, switch to idle
        if (this.actor.movement.direction.length() === 0) {
            this.manager.setState('idle');
            return;
        }
    }

}