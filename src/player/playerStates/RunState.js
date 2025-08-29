import PlayerState from "./_PlayerState";

export default class RunState extends PlayerState {
    constructor(actor, manager, options = {}) {
        super(actor, manager, options);
    }
    enter(floorDot) {
        this.actor.animator?.setAnimState('run');
        const floorValue = 1 - floorDot;
        if (floorDot) {
            console.log(`Floor: ${1 + floorValue}`);
        }
    }
    update(dt) {
        this.groundMove(dt)
        let strafe = true;
        // Jump
        if (this.input.keys['Space']) {
            this.actor.setState('jump');
            return;
        }
        if (this.input.keys['ShiftLeft'] && this.manager.tryDash()) {
            return;
        }
        if (this.input.keys['KeyW']) {
            strafe = false;
            this.actor.animator.setAnimState('run');
        }
        if (this.input.keys['KeyS']) {
            strafe = false;
            this.actor.animator.setAnimState('run');
        }
        if (this.input.keys['KeyA']) {
            if (strafe) {
                this.actor.animator.setAnimState('strafeLeft');
            }
        }
        if (this.input.keys['KeyD']) {
            if (strafe) {
                this.actor.animator.setAnimState('strafeRight');
            }
        }

        if (!this.actor.floorTrace()) {
            this.actor.setState('fall');
            return;
        }

        // If no movement, switch to idle
        if (this.direction.length() === 0) {
            this.actor.setState('idle');
            return;
        }
    }

}