import IdleState from "./IdleState";

export default class EmoteState extends IdleState {
    enter(state, emote) {
        this.actor.animator?.setAnimState(emote);
    }
}