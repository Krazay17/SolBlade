import { SkinnedMesh, Vector3 } from "three";
import Enemy from "../actors/Enemy";
import Pawn from "../actors/Pawn";
import GameScene from "../scenes/GameScene";
import Manager from "./Manager";
import Player from "../player/Player";
import AIMovement from "./AIMovement";

type Team = 'A' | 'B' | 'C';

export default class PawnManager {
    scene: GameScene;
    player: Pawn | null = null;
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
    setPlayer(pawn: Pawn) { this.player = pawn }
    addPawn(pawn: Pawn, team: Team) {
        this.scene.addActor(pawn);
        this.allPawns?.push(pawn);
        this.teamMap.set(pawn, team);
    }
    removePawn(pawn: Pawn) {
        this.allPawns?.splice(this.allPawns.indexOf(pawn), 1);
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
    spawnPlayer(pos: Vector3, isRemote: boolean = false, id: any, data: any) {
        const player = new Player(this.scene, pos, isRemote, id, data);
        this.addPawn(player, 'A');
        return player;
    }
}