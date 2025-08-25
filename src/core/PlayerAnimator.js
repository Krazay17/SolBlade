import { AnimationMixer } from "three";

export default class PlayerAnimator {
  constructor(mesh, animations) {
    this.mixer = new AnimationMixer(mesh);
    this.actions = {};
    this.actionName = null;

    animations.forEach((clip) => {
      this.actions[clip.name] = this.mixer.clipAction(clip);
      console.log('ANIMS: ', clip.name);
    });

    this.currentAction = null;
  }

  setState(state) {
    let actionName = null;

    switch(state) {
      case "attacking": actionName = "Attack"; break;
      case "jumping": actionName = "Jump"; break;
      case "falling": actionName = "FallLoopB"; break;
      case "strafeLeft": actionName = "StrafeLeft"; break;
      case "strafeRight": actionName = "StrafeRight"; break;
      case "run": actionName = "Run"; break;
      case "idle": actionName = "LaxIdle"; break;
    }

    if (actionName && this.actions[actionName]) {
      const nextAction = this.actions[actionName];
      if (this.currentAction !== nextAction) {
        if (this.currentAction) {
          this.currentAction.fadeOut(0.4);
        }
        nextAction.reset().fadeIn(0.4).play();
        this.currentAction = nextAction;
        this.actionName = actionName;
      }
    }
  }

  update(delta) {
    this.mixer.update(delta);
  }
}
