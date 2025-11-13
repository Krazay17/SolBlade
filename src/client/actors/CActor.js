import { Actor } from "@solblade/shared";
import { Mesh, MeshBasicMaterial, Object3D, SphereGeometry, Vector3, Quaternion } from "three";
import Game from "../CGame";
import MyEventEmitter from "../core/MyEventEmitter";
import RAPIER from "@dimforge/rapier3d-compat";

export default class CActor extends Actor {
    constructor(game, data = {}) {
        const posArr = data.pos;
        const dirArr = data.dir;
        const velArr = data.vel;
        const rotArr = data.rot;

        const pos = Array.isArray(posArr)
            ? new Vector3(posArr[0] || 0, posArr[1] || 0, posArr[2] || 0)
            : new Vector3(posArr?.x || 0, posArr?.y || 0, posArr?.z || 0);

        const dir = Array.isArray(dirArr)
            ? new Vector3(dirArr[0] || 0, dirArr[1] || 0, dirArr[2] || 0)
            : new Vector3(dirArr?.x || 0, dirArr?.y || 0, dirArr?.z || 0);
        const vel = Array.isArray(velArr)
            ? new Vector3(velArr[0] || 0, velArr[1] || 0, velArr[2] || 0)
            : new Vector3(velArr?.x || 0, velArr?.y || 0, velArr?.z || 0);
        const rot = Array.isArray(rotArr)
            ? new Quaternion(rotArr[0] || 0, rotArr[1] || 0, rotArr[2] || 0, rotArr[3] || 1)
            : new Quaternion(rotArr?.x || 0, rotArr?.y || 0, rotArr?.z || 0, rotArr?.w || 1);

        super({ ...data, pos, dir, rot, vel, active: false });
        /**@type {Game} */
        this.game = game;

        this.isRemote = data.isRemote ?? false;
        //this._quatY = this.rot.y;
        this._position = new Vector3();
        this._velocity = new Vector3();
        this._yaw = 0;
        this.upVec = new Vector3(0, 1, 0);

        this.graphics = new Object3D();

        /**@type {RAPIER.RigidBody} */
        this.body = null;
        /**@type {RAPIER.Collider} */
        this.collider = null;
        this.colliderDesc = null;

        if (!this.isRemote) {
            this.lastSentPos = this.pos;
        }

        this.init();
        this.activate();
    }
    get actorManager() { return this.game.actorManager };
    get position() {
        if (this.body) return this._position.copy(this.body?.translation())
        else return this.pos;
    }
    set position(pos) {
        this.body?.setTranslation(pos, false);
    }
    get rotation() {
        return this.body?.rotation();
    }
    get velocity() {
        return this._velocity.copy(this.body?.linvel());
    }
    get velocityX() {
        return this.body?.linvel().x
    }
    get velocityY() {
        return this.body?.linvel().y
    }
    get velocityZ() {
        return this.body?.linvel().z
    }
    set velocity(vel) {
        if (!this.body) return;
        this.body.setLinvel(vel, true);
    }
    set velocityX(x) {
        if (!this.body) return;
        const { y, z } = this.body.linvel();
        this.body.setLinvel({ x, y, z }, true);
    }
    set velocityY(y) {
        if (!this.body) return;
        const { x, z } = this.body.linvel();
        this.body.setLinvel({ x, y, z }, true);
    }
    set velocityZ(z) {
        if (!this.body) return;
        const { x, y } = this.body.linvel();
        this.body.setLinvel({ x, y, z }, true);
    }
    get yaw() { return this._yaw }
    set yaw(v) { this._yaw = v };
    sleep() {
        this.body?.sleep();
    }
    wakeUp() {
        this.body?.wakeUp();
    }
    setId(id) {
        this.id = id;
        if (this.collider) {
            this.collider.actor = id;
        }
    }
    update(dt, time) {
        if (!this.active) return;
        if (this.body) {
            const bodyPos = this.body.translation();
            if (this.graphics.position.distanceTo(bodyPos) < 55) {
                this.graphics.position.lerp(bodyPos, 30 * dt);
            } else {
                this.graphics.position.copy(bodyPos);
            }
            this.graphics.quaternion.slerp(this.rot, 30 * dt);
        }
    }
    fixedUpdate(dt) {
        if (!this.active) return;
        if (this.isRemote) {
            if (this.body) {
                this.body.setRotation(this.rot, true)
                this.body.setTranslation(this.pos, true);
            }
        }
    }
    async createMesh(meshName, color = "white") {
        let mesh;
        if (meshName) {
            mesh = await this.game.meshManager.getMesh(meshName)
        } else {
            mesh = new Mesh(
                new SphereGeometry(.5),
                new MeshBasicMaterial({ color })
            );
        }
        if (!mesh) return;
        this.graphics.add(mesh);
        return mesh;
    }
    activate(data) {
        if (this.active) return;
        if (data) Object.assign(this, data);
        if (this.graphics) {
            this.graphics.position.copy(this.pos);
            this.graphics.quaternion.copy(this.rot);
            this.game.add(this.graphics);
        }

        if (this.body && this.collider) {
            this.position = this.pos;
            this.body.wakeUp();
            this.collider.setEnabled(true);
        }
        if (!this.collider) {

        }

        this.active = true;
    }
    deActivate() {
        if (!this.active) return;
        this.game.actorManager.removeActor(this);
        this.game.remove(this.graphics);

        if (this.collider) {
            this.collider.setEnabled(false);
        }
        if (this.body) {
            this.body.sleep();
        }

        super.deActivate();
    }
    destroy() {
        if (this.destroyed) return;
        this.destroyed = true;
        this.game.remove(this.graphics);

        if (this.body) {
            this.game.physics.safeRemoveBody(this.body)
            this.body = null;
        }
        if (this.collider) {
            this.collider.actor = null;
            this.game.physics.safeRemoveCollider(this.collider);
            this.collider = null;
        }

        this.game.actorManager.removeActor(this);
        this.id = null;
        this.tempId = null;

    }
    add(obj) {
        this.graphics.add(obj)
    }
    remove(obj) {
        this.graphics.remove(obj)
    }
    hit(data) {
        if (!this.active) return;
        MyEventEmitter.emit('actorEvent', { id: this.id, event: "hit", data: data.serialize() });
        this.game.soundPlayer.playSound('badHit');
    }
}
