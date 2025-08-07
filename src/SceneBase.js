export default class SceneBase {
  constructor(game) {
    this.game = game; // Access camera, renderer, input, etc.
  }

  update(dt) {}
  render() {}
  onEnter() {}
  onExit() {}
}
