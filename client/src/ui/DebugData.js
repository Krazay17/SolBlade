import Globals from "../utils/Globals";
import LocalData from "../core/LocalData";

export default class DebugData {
    constructor() {
        this.fps = 0;
        this.dt = 0;
        this.createUI();
        this.active = true;
    }
    destroy() {
        this.active = false;
        this.debugSection.remove();
    }
    createUI() {
        this.debugSection = document.createElement('div');
        this.debugSection.id = 'debug-section';
        document.body.appendChild(this.debugSection);
    }

    update(dt, time) {
        if (!this.active) return;
        this.dt = dt;
        this.fps = 1 / dt;

        if(!Globals.player) return;
        const playerPos = Globals.player.position?.clone();
        if (!playerPos.x || !playerPos.y || !playerPos.z) return;

        this.debugSection.innerHTML = `
            <p>FPS: ${this.fps.toFixed(2)}</p>
            <p>X: ${playerPos.x.toFixed(2)}</p>
            <p>Y: ${playerPos.y.toFixed(2)}</p>
            <p>Z: ${playerPos.z.toFixed(2)}</p>
            <p>Player State: ${Globals.player.stateManager.currentStateName}</p>
            <p>Run Boost: ${Globals.player.movement.momentumBooster?.getBoost().toFixed(2) || 0}</p>
            <p>Player Speed: ${Math.round(Math.hypot(Globals.player.body?.velocity?.x, Globals.player.body?.velocity?.z) * 10)}</p>
            <p>Version: ${LocalData.version}<p>
        `;
    }
}