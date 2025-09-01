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

  destroy() {
    this.mixer.stopAllAction();
    this.actions = {};
    this.currentAction = null;
    this.mixer = null;
  }

  setAnimState(state, once = false, callback) {
    if (this.stateName === state) return;
    this.stateName = state;
    let seek = 0;
    let animName;
    switch (state) {
      case "idle":
        animName = "Idle";
        break;
      case "crouch":
        animName = "Crouch";
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
        animName = "Attack";
        seek = 0.15;
        break;
      case "knockback":
        animName = "KnockBack";
        break;
      case "rumbaDancing":
        animName = "RumbaDancing";
        break;
      case "twerk":
        animName = "Twerk";
        break;
      case "gunshoot":
        animName = "GunShoot";
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
      action.clampWhenFinished = true;
      // action.addEventListener('finished', () => {
      //   if (callback) callback();
      // });
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