import PlayerState from "./_PlayerState";

export default class RunState extends PlayerState {
    constructor(actor, manager, options = {}) {
        super(actor, manager, options);
    }
    update(dt) {
        this.actor.movement.groundMove(dt);

        if (!this.actor.groundChecker.isGrounded()) {
            this.manager.setState('fall');
            return;
        }
        if (this.actor.movement.getInputDirection().isZero()) {
            this.manager.setState('idle');
            return;
        }
        if (this.input.keys['Space']) {
            this.manager.setState('jump');
            return;
        }
        
        let strafe = true;
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

    }

}