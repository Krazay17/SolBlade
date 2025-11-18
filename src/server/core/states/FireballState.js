import State from "./State.js";

export default class FireballState extends State {
    constructor(game, pawn, data) {
        super(game, pawn, {
            ...data,
            name: 'fireball',
            cd: 2000,
            duration: 1500
        })
        this.delay = 500;

    }
    enter() {
        super.enter();
        this.pawn.setAnim('AttackSpell');
        this.movement.stop();
    }
    update(dt) {
        this.elapsed += dt * 1000;
        this.movement.rise(dt * 5)
        if (this.elapsed > this.delay) {
            this.setState('chase');
        }
    }
}