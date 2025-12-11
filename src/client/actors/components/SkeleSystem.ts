import { SolLoading } from "@solblade/client/core/SolLoading";
import { Actor } from "@solblade/common/actors/Actor";
import type { AnimationClip } from "three";
import * as THREE from "three";

interface Anim {
    name: string;
    time?: number;
    scale?: number;
    loop?: boolean;
}

export class SkeleSystem {
    actor: Actor
    mesh = null;
    mixer: THREE.AnimationMixer | null = null;
    currentAction: THREE.AnimationAction | null = null
    currentAnimation: string = '';
    animations: Record<string, AnimationClip> = {};
    _onFinishedListener: any;
    quedAnim: any;
    constructor(actor: Actor) {
        this.actor = actor;
    }
    update(dt) {
        if (this.mixer) this.mixer.update(dt);
        if (this.actor.anim) {
            this.playAnimation(this.actor.anim);
        }
    }
    async addSkele(loader: SolLoading) {
        const { mesh, animations } = await loader.meshManager.makeMesh(this.actor.model);
        this.actor.graphics.add(mesh);
        this.mixer = new THREE.AnimationMixer(mesh);
        this.mesh = mesh;
        animations.forEach((clip: AnimationClip) => {
            this.animations[clip.name] = clip;
        });
    }
    getAnim() {
        const anim = {
            name: this.currentAnimation,
            time: this.currentAction?.time,
            loop: this.currentAction?.loop === THREE.LoopRepeat,
            scale: this.currentAction?.timeScale,
        }
        return anim;
    }
    playAnimation(anim: Anim, qued?: Anim) {
        const { name, time = 0, scale = 1, loop = true } = anim;
        if (this.currentAnimation === name) return;
        const clip = this.animations[name];
        if (!clip) return;
        const action = this.mixer.clipAction(clip);
        if (this.currentAction && this.currentAction === action && scale === this.currentAction.timeScale) return;
        action.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, Infinity);
        action.clampWhenFinished = true;
        action.timeScale = scale;
        action.time = time;
        if (!this.currentAction) {
            action.play();
        } else {
            action.reset().fadeIn(0.1).play();
            this.currentAction.crossFadeTo(action, 0.2, false);
        }
        this.currentAction = action;
        this.currentAnimation = name;

        if (this._onFinishedListener) {
            if (this.quedAnim) clearTimeout(this.quedAnim)
            this._onFinishedListener = null;
        }
        if (!loop && qued) {
            const listener = () => {
                this.playAnimation(qued);
                this._onFinishedListener = null;
            }
            this._onFinishedListener = listener;
            const clipDuration = action.getClip().duration / action.timeScale * 1000;
            this.quedAnim = setTimeout(listener, clipDuration);
        }
    }
    changeTimeScale(scale: number) { }
}