import { Scene } from "three";
import { Graphics } from "./Graphics.js";
import { SolLoading } from "./SolLoading.js";
import SolWorld from "./SolWorld.js";
import SkyBox from "./SkyBox.js";

export class CWorld extends SolWorld {
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
        this.graphics = new Graphics(this.gameState);
        this.skyBox = new SkyBox(this, loader.textureLoader);
    }
    add(obj){
        this.graphics.add(obj);
    }
    async start() {
        await this.physics.makeWorld(this.name);
        await this.makeMap();
        this.globalScene.add(this.graphics.scene);
    }
    async makeMap() {
        const map = await this.loader.glLoader.loadAsync(`assets/${this.name}.glb`);
        if (!map) return;
        this.graphics.add(map.scene);
        map.scene.traverse(child => {

        })
    }
    tick(dt){
        this.skyBox.tick(dt);
    }
    exit() {
        this.globalScene.remove(this.graphics.scene);
        this.graphics.remove();
        this.physics.remove();
    }
}