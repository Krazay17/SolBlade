import ItemManager from "../core/ItemManager";
import LocalData from "../core/LocalData";
import Pickup from "./Pickup";
import * as THREE from 'three';

export default class ItemPickup extends Pickup {
    constructor(scene, pos, itemId, itemData) {
        super(scene, 'item', pos, itemId);
        this.itemManager = new ItemManager();
        this.itemData = itemData || this.itemManager.makeRandomItem();
        scene.addActor(this);

        this.init();
    }

    async init() {
        await this.createPickupMesh(.5);

        const tex = await this.scene.meshManager.getTex(this.itemData.name + '.png');
        const mesh = this.mesh.children[0];
        mesh.material = mesh.material.clone();
        mesh.material.map = tex;
        mesh.material.emissiveMap = tex;
        mesh.material.color.set(0xffffff);
        mesh.material.emissive.set(0xffffff);
        mesh.material.emissiveIntensity = 1;
        mesh.material.needsUpdate = true;
        const beam = this.mesh.children[1];
        beam.material.opacity = .6;
        beam.material.emissiveIntensity = 1;
        beam.material.emissive.set(0xffffff);
        beam.material.transparent = true;
    }

    applyCollect(player) {
        player.inventory.addItem(this.itemData);
        LocalData.addItem(this.itemData);
    }

    update(dt) {
        this.rotation.y += dt;
    }
}