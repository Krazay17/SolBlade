import { Scene } from "three";
import { SolLoading } from "@solblade/client/core/SolLoading.js"
import SolWorld from "@solblade/common/core/SolWorld.js";
import SkyBox from "./SkyBox.js";
import { CGame } from "../core/CGame.js";
import { spawnActor } from "@solblade/common/core/ActorFactory.js";
import { spawnA } from "@solblade/common/core/AFactory.js";

export class CWorld extends SolWorld {
    declare loader: SolLoading;
    localPlayer: string;
    game: CGame;
    globalScene: Scene;
    scene: Scene;
    skyBox: SkyBox;
    constructor(name: string, game: CGame) {
        super(name);
        this.game = game;
        this.globalScene = game.scene;
        this.loader = game.loader;
        this.localPlayer = game.player.id;

        this.scene = new Scene();
        this.globalScene.add(this.scene);
        this.skyBox = new SkyBox(this.loader.textureLoader);
        this.add(this.skyBox);
    }
    add(obj) {
        this.scene.add(obj);
    }
    async start() {
        await this.physics.makeWorld(this.name);
        await this.makeMap();
    }
    async makeMap() {
        const map = await this.loader.glLoader.loadAsync(`assets/${this.name}.glb`);
        if (!map) return;
        this.add(map.scene);
    }
    tick(dt: number) {
        super.tick(dt)
        this.skyBox.tick(dt);
    }
    exit() {
        this.physics.remove();
    }
    step(dt) {
        this.physics.step(dt);
    }
    removeRemoteActors() {
        this.actors.forEach((v, k) => {
            v.graphics.removeFromParent();
            this.actors.delete(k);
        });

        this.players.forEach((v, k) => {
            v.graphics.removeFromParent();
            this.actors.delete(k);
        });
    }
    updateState(data) {
        for (const d of data) {
            const { id, worldName, meshName } = d;
            if (id === this.game.player.id || worldName !== this.name) continue;
            const actor = this.actors.get(id);
            if (actor) {
                actor.actorUpdate.update(d);
            } else {
                const newActor = spawnA(this, d.type, "remote", d);
                this.actors.set(id, newActor);
            }
        }
    }
}