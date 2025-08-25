import Game from "./core/Game";
import LocalData from "./core/LocalData";
import GameScene from "./scenes/GameScene";
import { initSocket } from "./core/NetManager";

LocalData.load();
const canvas = document.getElementById('webgl');
const game = new Game(canvas);
const gameScene = new GameScene(game);

game.setScene(gameScene);
game.start();

initSocket();