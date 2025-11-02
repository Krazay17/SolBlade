import Projectile from "../actors/Projectile";
import Player from "../player/Player";
import World from "../scenes/World";

export default class ProjectileManager {
    scene: World;
    player: Player;
    projectiles: Projectile[] = [];
    lastProjectileUpdate: any = {};
    constructor(scene: World, player: Player) {
        this.scene = scene;
        this.player = player;
    }
    update(dt: number, time: number) {
        // let projectileUpdate: any = {}
        // for (const p of this.projectiles) {
        //     if (!p.netId) continue;
        //     const { pos } = this.lastProjectileUpdate[p.netId];
        //     if (p.position.distanceToSquared(pos) > .1) {
        //         projectileUpdate[p.netId] = p.serialize();
        //     }
        // }
        // this.lastProjectileUpdate = projectileUpdate;
        // MyEventEmitter.emit('updateProjectiles', this.lastProjectileUpdate);
    }
    spawnProjectile(type: string, data: any, isRemote: boolean = false) {
        let projectile;
        switch (type) {
            case 'fireball':
                projectile = this.scene.actorManager?.spawnActor('fireball', data, isRemote);
                break;
        }
        if (!projectile) return;
        this.projectiles.push(projectile as Projectile);
    }
}