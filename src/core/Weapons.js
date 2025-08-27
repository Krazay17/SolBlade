import * as THREE from 'three';

class Weapon {
    constructor(name, damage, range, cooldown) {
        this.name = name;
        this.damage = damage;
        this.range = range;
        this.cooldown = cooldown; // in seconds
        this.lastUsed = 0; // timestamp of last use
        this.position = new THREE.Vector3();
        this.direction = new THREE.Vector3();
    }

    canUse(currentTime) {
        return (currentTime - this.lastUsed) >= this.cooldown * 1000;
    }

    use(currentTime) {
        if (this.canUse(currentTime)) {
            this.lastUsed = currentTime;
            return true; // Weapon used successfully
        }
        return false; // Weapon is on cooldown
    }

    fireRay(pos, dir) {
        const result = new THREE.Ray(pos, dir);
        const ray = new THREE.Raycaster(pos, dir);
        ray.intersectObject(this.game.graphicsWorld.objects)
        console.log(ray);
    }
}

export class Pistol extends Weapon {
    constructor(scene) {
        super('Pistol', 10, 50, 0.5); // name, damage, range, cooldown
        this.scene = scene;
    }
    use(currentTime, pos, dir) {
        if (this.canUse(currentTime)) {
            this.lastUsed = currentTime;
            console.log('Pistol fired!');

            const visual = () => {
                new THREE.LineBasicMaterial({
                    color: 0x00FF00,
                });
                new THREE.Line()
                const shotGeom = new THREE.CylinderGeometry(.1, .1, 200, 6);
                const shotMat = new THREE.MeshBasicMaterial({
                    color: 0xFF0000,
                });
                const shotMesh = new THREE.Mesh(shotGeom, shotMat);
                shotMesh.position.copy(pos);
                const target = pos.add(dir);
                shotMesh.lookAt(target)
                this.scene.add(shotMesh);
            }
            visual();

            const data = () => {
                this.fireRay(pos, dir);
            }
            return true;
        }
        return false;
    }
}

export class Sword extends Weapon {
    constructor(actor) {
        super('Sword', 25, 5, .0001); // name, damage, range, cooldown
        this.actor = actor;
    }
    use(currentTime, pos, dir) {
        if (this.canUse(currentTime)) {
            this.lastUsed = currentTime;
            console.log('Sword swung!');
            this.actor?.animator?.setState('swordSwing', { doesLoop: false, prio: 2 });
            return true;
        }
        return false;
    }
}