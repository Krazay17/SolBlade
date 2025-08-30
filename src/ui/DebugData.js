import './StyleUI.css';

export default class DebugData {
    constructor(player) {
        this.player = player;
        this.fps = 0;
        this.dt = 0;
        this.createUI();
    }

    createUI() {
        this.debugSection = document.createElement('div');
        this.debugSection.id = 'debug-section';
        document.body.appendChild(this.debugSection);
    }

    update(dt, time) {
        this.dt = dt;
        this.fps = 1 / dt;
        const playerPos = this.player.position.clone();
        if (!playerPos.x || !playerPos.y || !playerPos.z) return;

        this.debugSection.innerHTML = `
            <p>FPS: ${this.fps.toFixed(2)}</p>
            <p>X: ${playerPos.x.toFixed(2)}</p>
            <p>Y: ${playerPos.y.toFixed(2)}</p>
            <p>Z: ${playerPos.z.toFixed(2)}</p>
            <p>Player State: ${this.player.stateManager.currentStateName}</p>
            <p>Run Boost: ${this.player.runBooster?.getBoost().toFixed(2) || 0}</p>
            <p>Player Speed: ${Math.round(Math.hypot(this.player.body.velocity.x, this.player.body.velocity.z) * 10)}</p>
        `;
    }
}