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
    this.setState("idle");
  }

  setState(state, { doesLoop = true, prio = 1, onFinish } = {}) {
    // If new state's priority is too low, ignore it
    if (prio < this.actionPrio) return;
    if(state === this.stateName) return;
    this.stateName = state;
    this.actionPrio = prio;

    let actionName = null;
    switch (state) {
      case "swordSwing": actionName = "AttackCombo.001"; break;
      case "attacking": actionName = "Attack"; break;
      case "jumping": actionName = "Jump"; break;
      case "falling": actionName = "FallLoopB"; break;
      case "strafeLeft": actionName = "StrafeLeft"; break;
      case "strafeRight": actionName = "StrafeRight"; break;
      case "run": actionName = "Run"; break;
      case "idle": actionName = "LaxIdle"; break;
    }
    if (!actionName || !this.actions[actionName]) return;

    const nextAction = this.actions[actionName];

    // If requesting the same action again
    if (this.currentAction === nextAction) {
      this.applyLoopSettings(nextAction, doesLoop);
      nextAction.reset().play();
      return;
    }

    // Fade out old
    if (this.currentAction) {
      this.currentAction.fadeOut(0.1);
      this.mixer.removeEventListener("finished", this._onFinished);
    }

    // Setup new action
    this.applyLoopSettings(nextAction, doesLoop);
    nextAction.reset().fadeIn(0.1).play();
    this.currentAction = nextAction;
    this.actionName = actionName;

    // Hook finished event if non-looping
    if (!doesLoop) {
      this._onFinished = (e) => {
        if (e.action === nextAction) {
          this.mixer.removeEventListener("finished", this._onFinished);
          this.actionPrio = 0; // reset prio
          if (onFinish) onFinish();
          //this.setState("idle", { doesLoop: true, prio: 0 });
        }
      };
      this.mixer.addEventListener("finished", this._onFinished);
    }
  }

  applyLoopSettings(action, doesLoop) {
    if (!doesLoop) {
      action.setLoop(THREE.LoopOnce, 1);
      action.clampWhenFinished = true;
    } else {
      action.setLoop(THREE.LoopRepeat, Infinity);
      action.clampWhenFinished = false;
    }
  }



  update(delta) {
    this.mixer.update(delta);
  }
}