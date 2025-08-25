import Game from "./core/Game";
import LocalData from "./core/LocalData";
import GameScene from "./scenes/GameScene";
import { io } from "socket.io-client";

LocalData.load();
const canvas = document.getElementById('webgl');
const game = new Game(canvas);
const gameScene = new GameScene(game);

game.setScene(gameScene);
game.start();


const socket = io("http://Localhost:3000");
socket.on("connect", () => {
    console.log(`I connected with id: ${socket.id}`);
});
