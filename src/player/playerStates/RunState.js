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
                // Jump
        if (this.input.keys['Space'] && this.grounded &&
            this.jumpCD < performance.now()) {
            this.jumpCD = performance.now() + 300;
            this.manager.setState('jump');
            return;
        }
        if (!this.actor.groundChecker.isGrounded(.1)) {
            if (!this.floorTimer) {
                this.floorTimer = setTimeout(() => {
                    this.floorTimer = null;
                    this.grounded = false;
                }, 200);
            }
        } else {
            clearTimeout(this.floorTimer);
            this.floorTimer = null;
            if (!this.grounded) {
                // do once on landing
            }

            this.grounded = true;
        }

    }

}