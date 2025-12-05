import type { AnimationClip } from "three";
import * as THREE from "three";
import type { SolLoading } from "../../core/SolLoading.js";
import type { CActor } from "../CActor.js";

export class SkeleSystem {
    owner: CActor
    mesh = null;
    mixer: THREE.AnimationMixer | null = null;
    currentAction: THREE.AnimationAction | null = null
    currentAnimation: string = '';
    animations: Record<string, AnimationClip> = {};
    _onFinishedListener: any;
    quedAnim: any;
    constructor(owner: CActor) {
        this.owner = owner;
    }
    async addSkele(loader: SolLoading, name: string) {
        const { mesh, animations } = await loader.meshManager.makeMesh(name);
        this.mesh = mesh;
        animations.forEach((clip: AnimationClip) => {
            this.animations[clip.name] = clip;
        });

    }
    playAnimation(name: string, loop: boolean = true, force: boolean = false, onFinished: any = null, rate = 1) {
        const clip = this.animations[name];
        if (clip) {
            if ((name === this.currentAnimation) && !force) return true;
            if (!this.mixer) return;
            const action = this.mixer.clipAction(clip);
            action.timeScale = rate;
            action.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, Infinity);
            action.clampWhenFinished = true;
            if (this.currentAction) {
                this.currentAction.timeScale = 1;
                this.currentAction.crossFadeTo(action, 0.2); // .125
            }

            action.reset().fadeIn(0.1).play();
            this.currentAction = action;
            this.currentAnimation = name;

            if (this._onFinishedListener) {
                if (this.quedAnim) clearTimeout(this.quedAnim)
                this._onFinishedListener = null;
            }
            if (!loop && onFinished) {
                const listener = () => {
                    try {
                        onFinished()
                    } catch (e) {
                        console.log('onFinished callback failed', e);
                    }
                    this._onFinishedListener = null;
                }
                this._onFinishedListener = listener;
                const clipDuration = action.getClip().duration / action.timeScale * 1000;
                this.quedAnim = setTimeout(listener, clipDuration);
            }

            return clip;
        } else {
            console.warn(`Animation ${name} not found.`);
            return false;
        }
    }
}