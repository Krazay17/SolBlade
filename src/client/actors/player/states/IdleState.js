import State from "./_PlayerState";

export default class IdleState extends State {
    enter(state, params) {
        if (!this.movement?.isGrounded) return this.fsm.setState('fall');
        if (state === 'attack') return this.idle();
        console.log('enter idle')
        switch (this.pivot()) {
            case 'Front':
                this.animation?.playAnimation('runStopFwd', false, false, () => this.idle()) || this.idle();
                break;
            case 'Left':
                this.animation?.playAnimation('runStopLeft', false, false, () => this.idle()) || this.idle();
                console.log('leftstop')
                break;
            case 'Right':
                this.animation?.playAnimation('runStopRight', false, false, () => this.idle()) || this.idle();
                break;
            case 'Back':
                this.animation?.playAnimation('runStopBack', false, false, () => this.idle()) || this.idle();
                break;
            default:
                this.idle();
        }
    }
    idle() {
        this.animation?.playAnimation('idle', true);
    }
    update(dt) {
        console.log(this.fsm);
        if (!this.movement?.isGrounded) return this.fsm.setState('fall');
        if (this.controller.inputDirection()) return this.fsm.setState('run');
        this.movement.idleMove(dt);
    }
}