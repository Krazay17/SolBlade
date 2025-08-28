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

  setAnimState(state) {
    if (this.stateName === state) return;
    this.stateName = state;
    const action = this.actions[state];
    if (!action) {
      console.warn(`No animation found for state: ${state}`);
      return;
    }
    if (this.currentAction === action) return;

    if (this.currentAction) {
      this.currentAction.fadeOut(0.2);
    }
    action.reset().fadeIn(0.2).play();
    this.currentAction = action;
  }

  update(delta) {
    this.mixer.update(delta);
  }
}