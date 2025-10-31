import PlayerState from "./_PlayerState";

export default class HealState extends PlayerState {
    update(dt, time) {
        this.movement.slowMove(dt);
    }
}