import * as THREE from 'three';
import Globals from '../utils/Globals';
import MyEventEmitter from '../core/MyEventEmitter';
import Actor from './Actor';
import MeshManager from '../core/MeshManager';

export default class Projectile extends Actor {
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

        this.meshManager = MeshManager.getInstance();

        this.isRemote = isRemote;
        this.init(pos, dir, speed, dur, scale);
        this.mesh = null;
        this.material = null;
        this.texture = null;
        this.duration = dur;
        this.radius = radius;

        this.tempVector = new THREE.Vector3();
        this.tempVector2 = new THREE.Vector3();
        this.tempVector3 = new THREE.Vector3();
        this.headOffset = new THREE.Vector3(0, 1, 0);
        this.footOffset = new THREE.Vector3(0, -.5, 0);
        this.active = true;
        this.gravity = 0; // Whether the projectile is affected by gravity

        Globals.scene.addActor(this);
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
        const geom = new THREE.SphereGeometry(this.radius, 16, 16);
        const material = new THREE.MeshLambertMaterial({
            emissive: 0xff0000,
            emissiveIntensity: 1,
            transparent: true,
            opacity: .9,
        });
        this.mesh = new THREE.Mesh(
            geom,
            material,
        );
        this.add(this.mesh);
        this.material = material
        this.applyTexture();
    }
    async applyTexture() {
        const texture = await this.meshManager.getTex('SkyFilter2.webp');
        this.material.map = texture;
        this.material.needsUpdate = true;
        this.texture = texture;
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


            for (const enemy of Globals.scene.getActors()) {
                if (enemy === this) continue;
                if (enemy === Globals.player) continue;
                this.headOffset.set(0, enemy.height, 0);
                this.footOffset.set(0, -enemy.radius, 0);
                const enemyHead = this.tempVector2.copy(enemy.position).add(this.headOffset);
                const enemyFoot = this.tempVector3.copy(enemy.position).add(this.footOffset);
                if (this.position.distanceToSquared(enemyHead) < this.radius
                    || this.position.distanceToSquared(enemyFoot) < this.radius) {
                    enemy.takeDamage?.(Globals.player, { amount: this.damage });
                    this.destroy();
                    break;
                }
            }

            const walls = Globals.scene.getMergedLevel();
            if (walls) {
                this.body.center.copy(this.position);
                if (walls.geometry.boundsTree.intersectsSphere(this.body)) {
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

    takeDamage() {
        this.destroy()
    }

    destroy() {
        this.active = false;
        if (this.parent) {
            this.parent.remove(this);
        }
        if (this.mesh) {
            this.mesh.visible = false;
            //this.mesh.geometry.dispose();
            //this.mesh.material.dispose();
        }
        Globals.scene.removeActor(this);
        if (this.isRemote) return;

        MyEventEmitter.emit('projectileDestroyed', this.netId);
    }
}
