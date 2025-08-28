import LocalData from "./core/LocalData";
import Game from "./core/Game";
import GameScene from "./scenes/GameScene";
import { initSocket } from "./core/NetManager";
import Menu from "./ui/Menu";
import soundPlayer from "./core/SoundPlayer";

await LocalData.load().then(() => {
    soundPlayer.setMasterVolume(LocalData.masterVolume);
    soundPlayer.playSound('music1');
});
initSocket();
const canvas = document.getElementById('webgl');
const game = new Game(canvas);
const gameScene = new GameScene(game);
const menu = new Menu();
menu.open();

game.setScene(gameScene);
game.start();

window.addEventListener('beforeunload', () => {
    LocalData.save();
});