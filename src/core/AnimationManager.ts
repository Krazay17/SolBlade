import * as THREE from 'three';

export default class AnimationManager {
    mixer: THREE.AnimationMixer;
    animations: { [key: string]: THREE.AnimationClip };
    currentAction: THREE.AnimationAction | null = null;
    timeScaleTimer: NodeJS.Timeout | null = null;
    currentAnimation: string | null = null;
    setAnimState = this.playAnimation;
    hitFreeze = this.changeTimeScale;

    constructor(model: THREE.Object3D, animations: THREE.AnimationClip[]) {
        this.mixer = new THREE.AnimationMixer(model);
        this.animations = {};
        animations.forEach((clip) => {
            this.animations[clip.name] = clip;
        });
        this.playAnimation('idle');
    }

    destroy() {
        this.mixer.stopAllAction();
        this.mixer.uncacheRoot(this.mixer.getRoot());
        this.animations = {};
    }

    playAnimation(name: string, loop: boolean = true) {
        const clip = this.animations[name];
        if (clip) {
            if ((name === this.currentAnimation)) return;
            const action = this.mixer.clipAction(clip);
            action.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, Infinity);
            action.clampWhenFinished = true;
            if (this.currentAction) {
                this.currentAction.timeScale = 1;
                this.currentAction.crossFadeTo(action, 0.125);
            }
            action.reset().fadeIn(0.1).play();
            this.currentAction = action;
            this.currentAnimation = name;
            return clip;
        } else {
            console.warn(`Animation ${name} not found.`);
        }
    }

    stopAnimation(name: string) {
        const clip = this.animations[name];
        if (clip) {
            const action = this.mixer.clipAction(clip);
            action.stop();
        }
    }

    changeTimeScale(scale: number = .1, duration: number = 140) {
        this.mixer.timeScale = scale;
        if (this.timeScaleTimer) {
            clearTimeout(this.timeScaleTimer);
            this.timeScaleTimer = null;
        }
        if (duration > 0) {
            this.timeScaleTimer = setTimeout(() => {
                this.mixer.timeScale = 1;
            }, duration);
        }
    }

    update(deltaTime: number) {
        this.mixer.update(deltaTime);
    }
}