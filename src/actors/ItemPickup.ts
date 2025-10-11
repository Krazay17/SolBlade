import { makeItem, makeRandomItem } from "../core/Item";
import LocalData from "../core/LocalData";
import Inventory from "../player/Inventory";
import Player from "../player/Player";
import GameScene from "../scenes/GameScene";
import Pickup from "./Pickup";

export default class ItemPickup extends Pickup {
    itemData: any;
    constructor(scene: GameScene, data: any) {
        super(scene, data);
        const {
            item = null,
            itemType = null,
        } = data;
        if (data.item) this.itemData = data.item;
        else if (data.itemType) this.itemData = makeItem(data.itemType);
        else this.itemData = makeRandomItem()

        this.height = 1;

        this.init();
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
    applyTouch(dealer: Player): void {
        const inv: Inventory | undefined = dealer.inventory;
        if (inv) {
            inv.addItem(this.itemData);
        }
        LocalData.addItem(this.itemData);
        LocalData.save();

        super.applyTouch(dealer);
    }
    update(dt: number, time: number) {
        super.update(dt, time)
        this.rotation.y += dt;
    }
}