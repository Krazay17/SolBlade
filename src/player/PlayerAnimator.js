import * as THREE from "three";

export default class PlayerAnimator {
  constructor(actor, mesh, animations) {
    this.actor = actor;
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
    this.setAnimState(this.actor.isLocal ? 'idle' : this.actor.currentAnimState);
  }

  setAnimState(state) {
    if (this.stateName === state) return;
    this.stateName = state;
    let once = false;
    let seek = 0;
    let animName;
    switch (state) {
      case "idle":
        animName = "Idle";
        break;
      case "run":
        animName = "Run";
        break;
      case "strafeLeft":
        animName = "StrafeLeft";
        break;
      case "strafeRight":
        animName = "StrafeRight";
        break;
      case "dash":
        animName = "Dash";
        break;
      case "jump":
        animName = "Jump";
        break;
      case "fall":
        animName = "FallLoop";
        break;
      case "attack":
        animName = "AttackCombo";
        seek = 0.15;
        break;
      case "knockBack":
        animName = "KnockBack";
        break;
      case "rumbaDancing":
        animName = "RumbaDancing";
        break;
      default:
        console.warn(`No animation state found for: ${state}`);
        return null;
    };
    const action = this.actions[animName];
    if (!action) {
      console.warn(`No animation found for state: ${state}`);
      return;
    }
    if (this.currentAction === action) return;

    if (once) {
      action.setLoop(THREE.LoopOnce);
    }
    if (this.currentAction) {
      this.currentAction.crossFadeTo(action, 0.15);
    }
    action.time = seek;
    action.reset().fadeIn(0.15).play();
    this.currentAction = action;
    if (seek) {
      action.time = seek;
    }

  }


  update(delta) {
    this.mixer.update(delta);
  }
}