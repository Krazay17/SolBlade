import { PerspectiveCamera } from "three";
import {Actor} from "../Actor";

export class CameraComponent {
    actor: Actor;
    camera: PerspectiveCamera;
    constructor(actor: Actor) {
        this.actor = actor;
        this.camera = new PerspectiveCamera(90, window.innerWidth / window.innerHeight, 1, 3000);
        this.actor.graphics.add(this.camera);
    }
    setFov(fov: number = 90) {
        return fov;
    }
}