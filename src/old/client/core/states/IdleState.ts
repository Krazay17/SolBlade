import State from "./State";
import Pawn from "../../actors/CPawn";

export default class IdleState extends State {
    enter(params?: any) {
        this.pawn.animationManager?.playAnimation('idle', true);
    }
}