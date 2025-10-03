import Globals from "../utils/Globals";
import { Scene } from "three";
import { World } from "cannon-es";
import Game from "../core/Game";

export default class SceneBase {
  constructor(game) {
    /**@type {Game} */
    this.game = game; // Access camera, renderer, input, etc.
    this.name = 'base';
    /** @type {Scene} */
    this.graphics = game.graphicsWorld;
    /** @type {World} */
    this.physics = game.physicsWorld;
    Globals.scene = this;
  }
  update(dt, time) { }
  render() { }
  onEnter() { }
  onExit() { }
}