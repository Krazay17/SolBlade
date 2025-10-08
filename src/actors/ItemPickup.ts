import LocalData from "../core/LocalData";
import GameScene from "../scenes/GameScene";
import Pickup from "./Pickup";

export default class ItemPickup extends Pickup {
    itemData: any;
    constructor(scene: GameScene, pos: any, itemData: any, type: string | null, netId: string) {
        super(scene, pos, netId);
        if (itemData) this.itemData = itemData;
        else if (type) this.itemData = scene.itemManager?.makeItem(type);
        else this.itemData = scene.itemManager?.makeRandomItem();

        this.init();
        this.scene.addActor(this);
    }
    async init() {
        await this.scene.meshManager?.getMesh('item').then((mesh) => {
            this.mesh = mesh;
            mesh.scale.set(.6, .6, .6);
            this.add(mesh);
            this.makeTexture(mesh);
        })
    }
    async makeTexture(mesh: any) {
        await this.scene.meshManager?.getTex(this.itemData.name + '.png').then((tex) => {
            if (!mesh || !mesh.children) return;

            const mesh1 = mesh.children[0];
            if (mesh1) {
                mesh1.material = mesh1.material.clone();
                mesh1.material.map = tex;
                mesh1.material.emissiveMap = tex;
                mesh1.material.color.set(0xffffff);
                mesh1.material.emissive.set(0xffffff);
                mesh1.material.emissiveIntensity = 1;
                mesh1.material.needsUpdate = true;
            }

            const beam = mesh.children[1];
            if (beam) {
                beam.material.opacity = .6;
                beam.material.emissiveIntensity = 1;
                beam.material.emissive.set(0xffffff);
                beam.material.transparent = true;
            }

        })
    }
    applyCollect(player: any) {
        player.inventory.addItem(this.itemData);
        LocalData.addItem(this.itemData);
    }
    update(dt: number) {
        this.rotation.y += dt;
    }
}