import { Scene } from "three";
import { SolLoading } from "@solblade/client/core/SolLoading.js"
import SolWorld from "@solblade/common/core/SolWorld.js";
import SkyBox from "./SkyBox.js";
import { CGame } from "../core/CGame.js";
import { spawnA } from "@solblade/common/core/AFactory.js";
import { Actor, ActorInit } from "@solblade/common/actors/Actor.js";

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
    addActor(actor: Actor): void {
        this.actors.set(actor.id, actor);
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
    removeActor(id: string) {
        console.log(id);
        const actor = this.actors.get(id);
        if (!actor) return;
        actor.destroy();
        if (actor.graphics) actor.graphics.removeFromParent();
        this.actors.delete(id);
    }
    updateState(serverState: Record<string, ActorInit>) {
        for (const [id, actor] of this.actors) {
            // Skip the local player
            if (id === this.game.player.id) continue;

            const serverData = serverState[id];

            if (serverData) {
                // Actor exists on both: Update it
                actor.replication.serverUpdate(serverData);
            } else {
                // Actor exists locally but NOT on server: Delete it
                this.removeActor(id);
            }
        }

        for (const id in serverState) {
            if (id === this.game.player.id) continue;

            if (!this.actors.has(id)) {
                const data = serverState[id];
                if (data.worldName === this.name) {
                    const newActor = spawnA(this, data.type, "remote", data);
                    this.actors.set(id, newActor);
                }
            }
        }
    }
}