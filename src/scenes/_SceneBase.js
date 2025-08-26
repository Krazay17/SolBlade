export default class SceneBase {
  constructor(game) {
    this.game = game; // Access camera, renderer, input, etc.
    this.name = 'base';
  }
  update(dt, time) {}
  render() {}
  onEnter() {}
  onExit() {}
}