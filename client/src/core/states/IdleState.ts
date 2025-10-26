import State from "./State";
import Pawn from "../../actors/Pawn";

export default class IdleState extends State {
    enter(params?: any) {
        this.pawn.animationManager?.playAnimation('idle', true);
    }
}