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
    this.setAnimState(this.actor.isRemote ? this.actor.currentAnimState : 'idle');
  }

  destroy() {
    this.mixer.stopAllAction();
    this.actions = {};
    this.currentAction = null;
    this.mixer = null;
  }

  setAnimState(state, once = false, reset = false) {
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
      case "jumpSpin":
        animName = "JumpSpin";
        break;
      case "fireball":
        animName = "Fireball";
        break;
      case "spinSlash":
        animName = "SpinSlash";
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
    if ((this.currentAction === action) && !reset) return;

    if (once) {
      action.setLoop(THREE.LoopOnce);
      action.clampWhenFinished = true;
      // action.addEventListener('finished', () => {
      //   if (callback) callback();
      // });
    }
    if (this.currentAction) {
      this.currentAction.timeScale = 1;
      this.currentAction.crossFadeTo(action, 0.125);
    }
    action.time = seek;
    action.reset().fadeIn(0.1).play();
    this.currentAction = action;
    if (seek) {
      action.time = seek;
    }

  }

  hitFreeze(duration = 170, scale = 0.025, scaleAfter = 1) {
    clearTimeout(this.hitFreezeTimeout);
    if (this.currentAction) {
      this.currentAction.timeScale = scale;
      this.hitFreezeTimeout = setTimeout(() => {
        this.currentAction.timeScale = scaleAfter;
      }, duration);
    }
  }


  update(delta) {
    this.mixer.update(delta);
  }
}