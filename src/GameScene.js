import SceneBase from './SceneBase.js';
import Player from './Player.js';

export default class GameScene extends SceneBase {
  constructor(game) {
    super(game);
    this.scene = new THREE.Scene();
    this.player = new Player(game);
  }

  update(dt) {
    this.player.update(dt);
  }

  render() {
    this.game.renderer.render(this.scene, this.game.camera);
  }
}
