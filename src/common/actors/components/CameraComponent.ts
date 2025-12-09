import { PerspectiveCamera } from "three";
import Actor from "../Actor";

export class CameraComponent{
    actor: Actor;
    camera: PerspectiveCamera;
    constructor(actor: Actor){
        this.actor = actor;
    }
}