import Game from "./core/Game";
import GameScene from "./scenes/GameScene";

const game = new Game();
const gameScene = new GameScene(game);

game.setScene(gameScene);
game.start();