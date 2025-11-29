import { CGame } from "./CGame";
import { CNet } from "./CNet";

const url = location.hostname === "localhost"
    ? "ws://localhost:8080"
    : "wss://srv.solblade.online";

async function init() {

    const game = new CGame();
    const net = new CNet(url);
}
init();