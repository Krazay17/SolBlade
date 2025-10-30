import { makeItem, makeRandomItem } from "../core/Item";
import TouchData from "../core/TouchData";
import World from "../scenes/World";
import Pickup from "./Pickup";
import * as THREE from 'three';

export default class ItemPickup extends Pickup {
    itemData: any;
    constructor(scene: World, data: any) {
        super(scene, data);
        if (data.item) this.itemData = data.item;
        else if (data.itemType) this.itemData = makeItem(data.itemType);
        else this.itemData = makeRandomItem()

        this.pickupSound = data.item.pickupSound;
        console.log(this.pickupSound)
        this.height = 1;

        this.init();
    }
    async init() {
        await this.scene.meshManager?.getMesh('item').then((mesh) => {
            this.mesh = mesh;
            if (this.mesh.children[0].geometry) {
                const edges = new THREE.EdgesGeometry(this.mesh.children[0].geometry, 35);
                const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xffffff }));
                this.mesh.add(line);
            }
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
    applyTouch(data: TouchData): void {
        super.applyTouch(data);
        const { dealer } = data;
        if (dealer === this.game.player) {
            this.game.inventory.aquireItem(this.itemData);
        }
    }
    update(dt: number, time: number) {
        super.update(dt, time)
        this.rotation.y += dt;
    }
}