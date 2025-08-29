import IdleState from "./IdleState";

export default class EmoteState extends IdleState {
    enter(emote) {
        this.actor.animator.setAnimState(emote);
    }
}