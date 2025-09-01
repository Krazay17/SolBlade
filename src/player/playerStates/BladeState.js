export default class BladeState extends PlayerState {
    constructor(actor, manager, options = {}) {
        super(actor, manager, options);
        this.friction = 0;
    }
    enter() {
        this.actor.animator?.setAnimState('blade');

        const floorDotHorz = 1 - this.actor.groundChecker.floorDot();
        this.body.velocity.mult(1 + floorDotHorz, this.body.velocity);
        this.actor.runBooster.setBoost(1 + floorDotHorz);
    }
    update(dt) {
        this.groundMove(dt);

        
        let strafe = true;
        // Jump
        if (this.input.keys['Space']) {
            this.manager.setState('jump');
            return;
        }
        if (this.input.keys['ShiftLeft']) {
            this.manager.setState('dash')
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
    }
}