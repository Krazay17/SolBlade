import AttackState from "./AttackState.js";

export default class FireballState extends AttackState {
    constructor(game, pawn, data) {
        super(game, pawn, {
            ...data,
            name: 'fireball',
            cd: 5000,
            duration: 2000,
            range: 20,
        })
        this.delay = 600;
        this.delay2 = 1500;
    }
    enter(prev, params) {
        super.enter(prev, params);
        this.movement.stop();
    }
    update(dt) {
        const { player, dir } = this.pawn.controller.blackboard;
        this.elapsed += dt * 1000;
        this.movement.rise(dt * 5);

        if (this.elapsed > this.delay && !this.fired1) {
            this.fired1 = true;
            this.shoot(dir);
        }
        if (this.elapsed > this.delay2 && !this.fired2) {
            this.fired2 = true;
            this.shoot(dir);
        }
        if (this.elapsed > this.duration) {
            this.setState('chase');
        }
    }
    exit() {
        super.exit();
        this.fired1 = false;
        this.fired2 = false;
    }
    shoot(dir) {
        const eyePos = this.pawn.pos;
        eyePos.y += 2;
        this.game.createActor('fireball', { sceneName: this.pawn.sceneName, pos: eyePos, dir, speed: 25, owner: this.pawn.id })
    }
}