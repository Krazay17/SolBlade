import * as THREE from "three";

export default class PlayerAnimator {
  constructor(mesh, animations) {
    this.mixer = new THREE.AnimationMixer(mesh);
    this.actions = {};
    this.actionName = null;
    this.stateName = null;
    this.montage = null;
    this.priority = 1;

    animations.forEach((clip) => {
      this.actions[clip.name] = this.mixer.clipAction(clip);
    });

    this.currentAction = null;
    this.setAnimState("LaxIdle");
  }

  setAnimState(state, once = false, seek = 0) {
    if (this.stateName === state) return;
    this.stateName = state;
    const action = this.actions[state];
    if (!action) {
      console.warn(`No animation found for state: ${state}`);
      return;
    }
    if (this.currentAction === action) return;

    if (once) {
      action.setLoop(THREE.LoopOnce);
    }
    if (this.currentAction) {
      this.currentAction.crossFadeTo(action, 0.1);
    }
    action.time = seek;
    action.reset().fadeIn(0.1).play();
    this.currentAction = action;
    if (seek) {
      action.time = seek;
    }

  }


  update(delta) {
    this.mixer.update(delta);
  }
}