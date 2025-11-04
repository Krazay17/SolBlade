import Player from "../player/Player";
import { MovementStates } from './states/StateManager'
import Enemy from "../actors/Enemy";
import AIMovement from "./AIMovement";
import { Vector2, Vector3 } from "three";
import PawnBody from "./PawnBody";
import Game from "../CGame";

export default class AIController {
    game: Game;
    pawn: Enemy;
    body: PawnBody | null;
    target: any | null = null;
    movement: AIMovement;
    homeLoc: Vector3;
    tempVector: Vector3 = new Vector3();
    temp2Vector: Vector2 = new Vector2();
    temp2Vector2: Vector2 = new Vector2();
    homeDist: Vector2 = new Vector2();
    private _meleeDistance: number = 1;
    constructor(game: Game, pawn: Enemy) {
        this.game = game;
        this.pawn = pawn;
        this.body = pawn.body;
        this.movement = pawn.movement as AIMovement;

        this.homeLoc = new Vector3().copy(this.pawn.position);
    }
    update(dt: number) {
        this.target = this.findClosestPlayer();
        this.handleStates(this.target);
    }
    findClosestPlayer() {
        if (!this.game.players) return;
        let closestPlayer: Player | null = null;
        let closestDistSq = Infinity;
        for (const p of this.game.players) {
            const distSq = this.pawn.position.distanceToSquared(p.position);
            if (distSq < 225 && distSq < closestDistSq) {
                closestPlayer = p;
                closestDistSq = distSq;
            }
        }
        return { closestPlayer, closestDistSq };
    }
    handleStates(target: any) {
        if (!this.target.closestPlayer) {
            const latLoc = this.temp2Vector.set(this.pawn.position.x, this.pawn.position.z);
            const homeLatLoc = this.temp2Vector2.set(this.homeLoc.x, this.homeLoc.z);
            const latDist = homeLatLoc.distanceToSquared(latLoc);
            if (latDist > this.meleeDistance * this.meleeDistance) {
                const homeDir = this.tempVector.copy(this.homeLoc).sub(this.pawn.position).normalize();
                this.pawn.stateManager?.setState(MovementStates.Walk);
                this.movement.walkToTarget(homeDir);
                return;
            }
            this.pawn.stateManager?.setState(MovementStates.Idle);
            this.movement.still();
            return;
        }
        const { closestPlayer, closestDistSq } = this.target;
        const directionToPlayer = closestPlayer.position.clone().sub(this.pawn.position).normalize();
        this.target.dir = directionToPlayer;
        if (closestDistSq && closestDistSq < this.meleeDistance * this.meleeDistance) {
            this.pawn.stateManager?.setState(MovementStates.Attack)
        } else {
            this.pawn.stateManager?.setState(MovementStates.Walk);
        }
    }
    set meleeDistance(dist: number) {
        this._meleeDistance = dist;
    }
    get meleeDistance() { return this._meleeDistance; }
}