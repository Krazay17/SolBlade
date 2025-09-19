import * as THREE from 'three';
import Globals from '../utils/Globals';
import MyEventEmitter from '../core/MyEventEmitter';

export default class Projectile extends THREE.Object3D {
    constructor(params = {}, net = {}) {
        super();

        const {
            pos = new THREE.Vector3(),
            dir = new THREE.Vector3(0, 0, 1),
            speed = 1,
            dur = 4000,
            scale = { x: 1, y: 1, z: 1 },
            radius = 1,
        } = params;

        const {
            isRemote = false,
            netId = null
        } = net;

        this.isRemote = isRemote;
        this.init(pos, dir, speed, dur, scale);
        this.mesh = null;
        this.duration = dur;
        this.radius = radius;

        this.tempVector = new THREE.Vector3();
        this.active = true;
        this.gravity = 0; // Whether the projectile is affected by gravity

        Globals.scene.addTickable(this);
        Globals.graphicsWorld.add(this);

        if (this.isRemote) {
            this.targetPosition = this.position.clone();
            this.netId = netId; // Use provided netId for remote projectiles
        } else {
            this.netId = `${Date.now()}-${Math.floor(Math.random() * 1e9)}`; // Unique string
            this.createBody();
        }
    }

    init(pos, dir, speed, dur, scale) {
        this.position.set(pos.x, pos.y, pos.z);
        this.direction = dir;
        this.scale.set(scale.x, scale.y, scale.z);
        this.velocity = new THREE.Vector3(
            dir.x * speed,
            dir.y * speed,
            dir.z * speed
        );
        this.duration = dur
    }

    netInit(type, extra = {}) {
        MyEventEmitter.emit('projectileCreated', {
            type,
            netId: this.netId,
            pos: { x: this.position.x, y: this.position.y, z: this.position.z },
            dir: this.direction,
            speed: this.speed,
            dur: this.duration,
        });
    }

    setDamage(amnt) {
        this.damage = amnt;
    }

    createMesh() {
        this.mesh = new THREE.Mesh(
            new THREE.SphereGeometry(this.radius, 16, 16),
            new THREE.MeshBasicMaterial({ color: 0xff0000 }),
        );
        this.add(this.mesh);
    }

    createBody() {
        this.body = new THREE.Sphere(new THREE.Vector3(), this.radius / 2);
    }

    setTargetPos(pos) {
        this.targetPosition = pos;
    }

    update(deltaTime) {
        if (!this.active) return;
        if (this.isRemote) {
            this.position.lerp(this.targetPosition, 10 * deltaTime);
        } else {
            // Update the position of the projectile based on its velocity
            this.tempVector.copy(this.velocity).multiplyScalar(deltaTime);
            if (this.gravity) {
                this.velocity.y -= this.gravity * deltaTime; // Apply gravity
            }
            this.position.add(this.tempVector);
            if (!this.delayNetUpdate || this.delayNetUpdate < performance.now()) {
                this.delayNetUpdate = performance.now() + 50;
                MyEventEmitter.emit('projectileMoved', {
                    netId: this.netId,
                    pos: { x: this.position.x, y: this.position.y, z: this.position.z },
                });
            }


            for (const enemy of Globals.enemyActors) {
                if (this.position.distanceToSquared(enemy.position) < this.radius) {
                    enemy.takeDamage(Globals.player, { amount: this.damage });
                    this.destroy();
                    break;
                }
            }

            const walls = Globals.scene.getMergedLevel();
            if (walls) {
                this.body.center.copy(this.position);
                if (walls.geometry.boundsTree.intersectsSphere(this.body)) {
                    console.log('prjoectile Hit!');
                    this.destroy();
                }
            }

            this.duration -= deltaTime * 1000;
            if (this.duration <= 0) {
                this.destroy();
            }
        }
    }

    setGravity(amount) {
        this.gravity = amount;
    }

    destroy() {
        this.active = false;
        if (this.parent) {
            this.parent.remove(this);
        }
        if (this.mesh) {
            this.mesh.visible = false;
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
        }
        Globals.scene.removeTickable(this);
        if (this.isRemote) return;

        MyEventEmitter.emit('projectileDestroyed', this.netId);
    }
}
