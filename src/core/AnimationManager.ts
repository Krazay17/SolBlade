import * as THREE from 'three';
import MyEventEmitter from './MyEventEmitter';
import Pawn from '../actors/Pawn';

export default class AnimationManager {
    pawn: Pawn;
    mixer: THREE.AnimationMixer;
    animations: { [key: string]: THREE.AnimationClip };
    currentAction: THREE.AnimationAction | null = null;
    timeScaleTimer: NodeJS.Timeout | null = null;
    currentAnimation: string | null = null;
    _onFinishedListener: any;
    setAnimState = this.playAnimation;
    hitFreeze = this.changeTimeScale;

    constructor(pawn: Pawn, model: THREE.Object3D, animations: THREE.AnimationClip[]) {
        this.pawn = pawn;
        this.mixer = new THREE.AnimationMixer(model);
        this.animations = {};
        animations.forEach((clip) => {
            if (clip.name.startsWith('')) {
                // blend anims
            }
            this.animations[clip.name] = clip;
        });
        this.playAnimation('idle');
    }

    destroy() {
        this.mixer.stopAllAction();
        this.mixer.uncacheRoot(this.mixer.getRoot());
        this.animations = {};
    }

    playAnimation(name: string, loop: boolean = true, onFinished: any = null) {
        const clip = this.animations[name];
        if (clip) {
            if ((name === this.currentAnimation)) return;
            const action = this.mixer.clipAction(clip);
            action.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, Infinity);
            action.clampWhenFinished = true;
            if (this.currentAction) {
                this.currentAction.timeScale = 1;
                this.currentAction.crossFadeTo(action, 0.175); // .125
            }
            action.reset().fadeIn(0.1).play();
            this.currentAction = action;
            this.currentAnimation = name;

            if (this._onFinishedListener) {
                this.mixer.removeEventListener('finished', this._onFinishedListener);
                this._onFinishedListener = null;
            }
            if (!loop && onFinished && !this.pawn.isRemote) {
                const listener = () => {
                    try {
                        onFinished()
                    } catch (e) {
                        console.log('onFinished callback failed', e);
                    }
                    this.mixer.removeEventListener('finished', listener);
                    this._onFinishedListener = null;
                }
                this._onFinishedListener = listener;
                this.mixer.addEventListener('finished', listener);
            }

            if (!this.pawn.isRemote) MyEventEmitter.emit('playAnimation', { name, loop });

            return clip;
        } else {
            console.warn(`Animation ${name} not found.`);
            return false;
        }
    }
    queAnimation(name: string, loop: boolean = true) {
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
        if (this.pawn.isRemote) return;
        MyEventEmitter.emit('changeAnimation', { scale, duration });
    }

    update(deltaTime: number) {
        this.mixer.update(deltaTime);
    }
}