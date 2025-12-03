import { Scene } from "three";
import { Graphics } from "./Graphics.js";
import { SolLoading } from "./SolLoading.js";
import SolWorld from "./SolWorld.js";
import SkyBox from "./SkyBox.js";
import { CActor } from "@solblade/client/actors/CActor.js";
import AnimationManager from "@solblade/client/actors/components/AnimationManager.js";

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
        this.skyBox = new SkyBox(this, loader.textureLoader);

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
        this.scene.add(map.scene);
    }
    /**@param {CActor}actor */
    async onNewActor(actor) {
        const { mesh, animations } = await this.loader.meshManager.makeMesh('Wizard');
        if (!mesh) return;
        //@ts-ignore
        actor.mesh = mesh;
        //@ts-ignore
        actor.animation = new AnimationManager(actor, mesh, animations);
        //@ts-ignore
        this.scene.add(mesh);
    }
    newActor(data) {
        const { id, } = data;
        const actor = new CActor(data);
        this.actors.set(id, actor);
        if (this.onNewActor) this.onNewActor(actor)
    }
    tick(dt) {
        this.skyBox.tick(dt);
        this.actors.forEach((v) => {
            v.tick?.(dt);
        })
    }
    exit() {
        this.physics.remove();
    }
    step(dt) {
        this.physics.step(dt);
    }
    updateState(data) {
        super.updateState(data);
    }
}