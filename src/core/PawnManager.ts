import { SkinnedMesh, Vector3 } from "three";
import Enemy from "../actors/Enemy";
import Pawn from "../actors/Pawn";
import GameScene from "../scenes/GameScene";
import AIMovement from "./AIMovement";

type Team = 'A' | 'B' | 'C';

export default class PawnManager {
    scene: GameScene;
    player: Pawn | null = null;
    _players: Pawn[] = [];
    allPawns: Pawn[] = [];
    teamMap: Map<Pawn, Team> = new Map();
    constructor(scene: GameScene) {
        this.scene = scene;
    }
    spawnEnemy(type: string, pos: Vector3) {
        let enemy: Enemy | null = null;
        switch (type) {
            case 'LavaGolem':
                enemy = new Enemy(this.scene, pos, type, .5, 2.5);
                this.addPawn(enemy, 'A');
                enemy.scale.set(2.2, 2.2, 2.2);
                break;
            case 'julian':
                enemy = new Enemy(this.scene, pos, type, .5, .8);
                this.addPawn(enemy, 'A');
                enemy.scale.set(.7, .7, .7);
                const movement = enemy.movement as AIMovement;
                movement.setSpeed(5);
                if (enemy.controller) enemy.controller.meleeDistance = 1
                break;
            default:
                console.log(`${type} not added to PawnManager`);
        }
        if (!enemy) return;
        this.addPawn(enemy, 'A');
    }
    setLocalPlayer(pawn: Pawn) { this.player = pawn }
    addPawn(pawn: Pawn, team: Team) {
        this.allPawns?.push(pawn);
        this.teamMap.set(pawn, team);
    }
    removePawn(pawn: Pawn) {
        if (!pawn) return;
        pawn.destroy();
        const indx = this.allPawns.indexOf(pawn);
        this.allPawns?.splice(indx, 1);
    }
    update(dt: number, time: number) {
    }
    getTeam(pawn: Pawn) {
        return this.teamMap.get(pawn);
    }
    changeTeam(pawn: Pawn, team: Team) {
        this.teamMap.set(pawn, team);
    }
    get hostileMeshes(): SkinnedMesh[] {
        return this.hostiles.map(pawn => pawn.getMeshBody() as SkinnedMesh).filter(Boolean);
    }
    get hostiles(): Pawn[] {
        if (!this.player) return [];
        const playerTeam = this.teamMap.get(this.player);
        const hostiles = this.allPawns.filter(pawn => pawn !== this.player
            && (this.teamMap.get(pawn) === 'A')
            || this.teamMap.get(pawn) !== playerTeam)
        return hostiles;
    }
    get players(): Pawn[] {
        return this._players;
    }
    spawnPlayer(data: any, isRemote: boolean = false) {
        const player = this.scene.actorManager?.spawnActor('player', data, isRemote, true);
        if (!player) return;
        this.addPawn(player as Pawn, 'A');
        this._players?.push(player as Pawn);
        return player;
    }
    getPawnById(id: string) {
        return this.allPawns.find(p => p.netId === id);
    }
    getEnemiesInRange(position: Vector3, range: number) {
        const enemiesInRange = new Map();
        for (const enemy of this.hostiles) {
            const dist = enemy.position.distanceToSquared(position);
            if (dist <= range) {
                enemiesInRange.set(enemy, dist);
            }
        }
        return enemiesInRange;
    }
}