import RAPIER from "@dimforge/rapier3d-compat";
import { COLLISION_GROUPS, SOL_PHYSICS_SETTINGS } from "../data/SolConstants.js";
import { Actor } from "../actors/Actor.js";

export interface PhysicsConfig {
    shape?: "pawn" | "capsule" | "box" | "ball" | "trimesh";
    mass?: number;
    height?: number;
    radius?: number;
    vertices?: Float32Array | number[];
    indices?: Uint32Array | number[];
    collisionGroup?: number;
    sensor?: boolean;
}

export class Physics {
    world = new RAPIER.World(SOL_PHYSICS_SETTINGS.gravity);
    remove() {
        this.world.free();
    }
    step(dt) {
        this.world.step();
    }
    async makeWorld(name: string) {
        let worldData;
        const worldModule = await import(`../worlds/${name}.json`);
        worldData = worldModule.default;
        if (!worldData) return;
        const colliders = colliderFromJson(worldData);
        for (const { vertices, indices } of colliders) {
            const desc = RAPIER.ColliderDesc.trimesh(vertices, indices);
            desc.setCollisionGroups(COLLISION_GROUPS.WORLD << 16 | (COLLISION_GROUPS.ENEMY | COLLISION_GROUPS.PLAYER));

            this.world.createCollider(desc);
        }
    }
    makeBody(actor: Actor, options: PhysicsConfig = {}, scale: number = 1, isProxy: boolean = false) {
        const h = (options.height ?? 1) * scale;
        const r = (options.radius ?? 0.5) * scale;
        const shape = options.shape || "pawn";

        const bodyD = isProxy
            ? RAPIER.RigidBodyDesc.kinematicPositionBased()
            : RAPIER.RigidBodyDesc.dynamic();

        let colliderD: RAPIER.ColliderDesc;

        switch (shape) {
            case "capsule":
            case "pawn":
                colliderD = RAPIER.ColliderDesc.capsule(h / 2, r);
                if (shape === "pawn") {
                    bodyD.lockRotations().setLinearDamping(0).setAngularDamping(0);
                }
                break;
            case "box":
                colliderD = RAPIER.ColliderDesc.cuboid(h, h, h);
                break;
            case "ball":
                colliderD = RAPIER.ColliderDesc.ball(r);
                break;
            case "trimesh":
                if (!options.vertices || !options.indices) throw new Error("Trimesh missing data");
                colliderD = RAPIER.ColliderDesc.trimesh(
                    options.vertices as Float32Array,
                    options.indices as Uint32Array
                );
                break;
            default:
                throw new Error(`Unknown shape: ${shape}`);
        }

        const group = this.resolveCollisionGroup(shape, isProxy, options.collisionGroup);
        if (group) colliderD.setCollisionGroups(group);

        colliderD.setFriction(0).setRestitution(0);
        if (options.sensor) colliderD.setSensor(true);

        const body = this.world.createRigidBody(bodyD);
        body.setTranslation(actor.vecPos, true);
        const collider = this.world.createCollider(colliderD, body);

        if (options.mass !== undefined) collider.setMass(options.mass);

        actor.body = body;
        actor.collider = collider;
        return { body, collider };
    }
    private resolveCollisionGroup(shape: string, isProxy: boolean, override?: number): number | null {
        if (override) return override;

        // Projectiles
        if (shape === "ball") {
            return COLLISION_GROUPS.PROJECTILE << 16 | COLLISION_GROUPS.WORLD;
        }

        // Pawns / Players / Enemies
        if (shape === "pawn") {
            // isProxy = true usually means it's an enemy or remote player
            if (isProxy) {
                return COLLISION_GROUPS.ENEMY << 16 | (COLLISION_GROUPS.PLAYER | COLLISION_GROUPS.WORLD);
            } else {
                return COLLISION_GROUPS.PLAYER << 16 | (COLLISION_GROUPS.WORLD | COLLISION_GROUPS.ENEMY);
            }
        }

        return null;
    }
}

function colliderFromJson(data) {
    const colliders = [];
    for (const obj of data) {
        if (!obj.vertices?.length || !obj.indices?.length) {
            console.warn("Skipping object with missing vertices or indices:", obj.name);
            continue;
        }

        // Filter vertices to ensure each has 3 numbers
        const filteredVerts = obj.vertices.filter(v => Array.isArray(v) && v.length === 3);
        if (filteredVerts.length === 0) {
            console.warn("Skipping object with no valid vertices:", obj.name);
            continue;
        }

        const vertices = new Float32Array(filteredVerts.flat());

        // Flatten indices
        const indices = new Uint32Array(obj.indices.flat());
        const maxIndex = Math.max(...indices);
        if (maxIndex >= vertices.length / 3) {
            console.warn("Skipping object with indices out of bounds:", obj.name);
            continue;
        }

        colliders.push({ vertices, indices });
    }
    return colliders;
}