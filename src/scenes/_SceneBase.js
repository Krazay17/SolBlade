export default class SceneBase {
  constructor(game) {
    this.game = game; // Access camera, renderer, input, etc.
  }
  update(dt, time) {}
  render() {}
  onEnter() {}
  onExit() {}
}