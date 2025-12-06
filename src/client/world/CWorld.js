import { Scene } from "three";
import { SolLoading } from "@solblade/client/core/SolLoading.js"
import SolWorld from "@solblade/common/core/SolWorld.js";
import SkyBox from "./SkyBox.js";
import { CActor } from "@solblade/client/actors/CActor";

export class CWorld extends SolWorld {
    /**@type {Map<string, CActor>} */
    actors = new Map();
    /**
     * 
     * @param {*} name 
     * @param {Scene} globalScene
     * @param {SolLoading} loader 
     */
    constructor(name, globalScene, loader) {
        super(name)
        this.globalScene = globalScene;
        this.loader = loader;

        this.scene = new Scene();
        globalScene.add(this.scene);
        this.skyBox = new SkyBox(loader.textureLoader);
        this.add(this.skyBox);

        this.actorMesh = new Map();
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
    tick(dt) {
        this.actors.forEach((a) => {
            a.tick?.(dt);
        });
        this.skyBox.tick(dt);
    }
    exit() {
        this.physics.remove();
    }
    step(dt) {
        this.physics.step(dt);
    }
}