import * as THREE from "three";
import CPickup from "./CPickup";

export default class CCard extends CPickup {
    init() {
        this.build();
    }
    async build() {
        const mesh = await this.createMesh('item');
        mesh.scale.x = .3;
        mesh.scale.y = .3;
        mesh.scale.z = .3;
        const tex = await this.makeTexture(mesh);
        const geom = mesh.children[0].geometry;
        this.createBody(null, geom);
    }
    update(dt, time) {
        super.update(dt, time);
        this.yaw += dt
    }
    async makeTexture(mesh) {
        await this.game.meshManager?.getTex(this.data.itemData.name + '.png').then((tex) => {
            if (!mesh || !mesh.children) return;

            const mesh1 = mesh.children[0];
            tex.colorSpace = THREE.SRGBColorSpace;
            if (mesh1) {
                const mat = new THREE.MeshStandardMaterial({
                    emissive: 0xffffff,
                    emissiveIntensity: 1,
                    metalness: 0.1,
                    roughness: 0.1,
                    map: tex,
                    emissiveMap: tex
                });
                mesh1.material = mat;
            }

            const beam = mesh.children[1];
            if (beam) {
                beam.material.transparent = true;
            }

        })
    }
}