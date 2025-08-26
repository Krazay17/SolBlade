import Globals from "../utils/Globals";

export default class SceneBase {
  constructor(game) {
    this.game = game; // Access camera, renderer, input, etc.
    this.name = 'base';
    Globals.scene = this;
  }
  update(dt, time) {}
  render() {}
  onEnter() {}
  onExit() {}
}