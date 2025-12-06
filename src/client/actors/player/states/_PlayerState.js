import State from "@solblade/server/actors/states/State";

export default class PlayerState extends State {
    constructor(fsm, owner) {
        super(fsm, owner);
    }
    get animation() { return this.owner.animation }
}