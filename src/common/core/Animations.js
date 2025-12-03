import * as THREE from "three";

export class Animations {
    /**
     * 
     * @param {THREE.Object3D} mesh 
     * @param {THREE.AnimationClip[]} clips 
     */
    constructor(mesh, clips) {
        this.mixer = new THREE.AnimationMixer(mesh);
        this.clips = clips;
    }
    playAnimation(anim) {
        let action;
        if (typeof anim === "number") {
            action = this.mixer.clipAction(this.clips[anim]);
        } else {
            action = this.mixer.clipAction(this.clips.find(a => a.name === anim));
        }
        action.reset().fadeIn(0.1).play();
    }
}