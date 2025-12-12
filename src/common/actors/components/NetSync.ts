import { Actor } from "../Actor";
import { Vector3, Quaternion } from "three";
import { CNet } from "@solblade/client/core/CNet";
import { NET } from "@solblade/common/net/NetProtocol";

export class NetworkSync {
    actor: Actor;
    net?: CNet; // Only exists on Client

    // Config
    sendRate = 1000 / 20; // Send updates 20 times per second (50ms)
    threshold = 0.01; // Minimum distance to trigger update

    // State
    lastSendTime = 0;
    lastPos = new Vector3();
    lastRot = new Quaternion();

    // Interpolation (For Remote Actors)
    targetPos = new Vector3();
    targetRot = new Quaternion();
    smoothSpeed = 10.0; // How fast we lerp to the target

    constructor(actor: Actor, net?: CNet) {
        this.actor = actor;
        this.net = net;

        // Initialize targets to current state to prevent jumping on spawn
        this.targetPos.fromArray(actor.pos);
        this.targetRot.fromArray(actor.rot);
        this.lastPos.fromArray(actor.pos);
        this.lastRot.fromArray(actor.rot);
    }

    tick(dt: number) {
        if (this.isOwner()) {
            this.handleSending();
        } else {
            this.handleReceiving(dt);
        }
    }

    private isOwner(): boolean {
        // If we are on the server, we are never the "client owner" in this specific context
        // If on client: compare local player ID to actor ID
        if (!this.net) return false; // We are likely on server or offline
        return this.actor.id === this.net.socket.id;
    }

    // --- SENDER LOGIC (Local Player) ---
    private handleSending() {
        const now = performance.now();
        if (now - this.lastSendTime < this.sendRate) return;

        const currentPos = this.actor.vecPos;
        const currentRot = this.actor.quatRot;

        // Check distance squared (faster than distance)
        const distSq = this.lastPos.distanceToSquared(currentPos);
        const angDist = this.lastRot.angleTo(currentRot);

        const animName = this.actor.animation?.getAnim()?.name;
        // Optimization: Handle anim syncing separately or check for changes here

        if (distSq > this.threshold * this.threshold || angDist > this.threshold) {
            this.lastSendTime = now;
            this.lastPos.copy(currentPos);
            this.lastRot.copy(currentRot);

            // Create payload
            const update = {
                id: this.actor.id,
                pos: currentPos.toArray(),
                rot: currentRot.toArray(),
                anim: this.actor.animation?.getAnim() // Send full anim data
            };

            this.net?.emit(NET.CLIENT.PLAYER_SENDUPDATE, update);
        }
    }

    // --- RECEIVER LOGIC (Remote Players) ---
    // Called by tick() to smooth visuals
    private handleReceiving(dt: number) {
        // 1. Interpolate Graphics
        if (this.actor.graphics) {
            this.actor.graphics.position.lerp(this.targetPos, this.smoothSpeed * dt);
            this.actor.graphics.quaternion.slerp(this.targetRot, this.smoothSpeed * dt);
        }

        // 2. Snap Physics (Crucial!)
        // We do NOT interpolate physics bodies. We snap them to the target
        // so collisions are accurate to where the network says they are.
        if (this.actor.body) {
            this.actor.body.setTranslation({
                x: this.targetPos.x,
                y: this.targetPos.y,
                z: this.targetPos.z
            }, true);

            this.actor.body.setRotation({
                x: this.targetRot.x,
                y: this.targetRot.y,
                z: this.targetRot.z,
                w: this.targetRot.w
            }, true);
        }
    }

    // Called when a packet arrives from the server
    onServerUpdate(data: any) {
        if (data.pos) this.targetPos.fromArray(data.pos);
        if (data.rot) this.targetRot.fromArray(data.rot);

        if (data.anim && this.actor.anim?.name !== data.anim.name) {
            // Directly apply animation, no lerping needed for state switches usually
            this.actor.anim = data.anim;
            // Trigger your animation component here if needed
        }
    }
}