import Projectile from "../actors/Projectile";
import ProjectileFireball from "../actors/ProjectileFireball";
import Player from "../player/Player";
import GameScene from "../scenes/GameScene";

export default class ProjectileManager {
    scene: GameScene;
    player: Player;
    projectiles: Projectile[] = [];

    constructor(scene: GameScene, player: Player) {
        this.scene = scene;
        this.player = player;
    }
    update(dt: number, time: number) {
        for (const p of this.projectiles) {
            p.update(dt);
        }
    }
    spawnProjectile(type: string, data: any, netData: any) {
        let projectile;
        switch (type) {
            case 'fireball':
                projectile = new ProjectileFireball(this.scene, data, netData);
                break;
        }
        if (!projectile) return;
        this.projectiles.push(projectile);
    }
}