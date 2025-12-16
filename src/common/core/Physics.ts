import RAPIER from "@dimforge/rapier3d-compat";
import { COLLISION_GROUPS, SOL_PHYSICS_SETTINGS } from "../data/SolConstants.js";
import { Actor } from "../actors/Actor.js";

export interface PhysicsConfig {
    shape?: "capsule" | "box";
    mass?: number;
    height?: number;
    radius?: number;
}
export class Physics {
    world: RAPIER.World;
    constructor() {
        this.world = new RAPIER.World(SOL_PHYSICS_SETTINGS.gravity);
    }
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
    makeBody(actor: Actor, options: PhysicsConfig = {}, remote: boolean = false) {
        const {
            shape = "capsule",
            height = 1,
            radius = 0.5,
            mass = undefined,
        } = options;

        const collideGroup = remote
            ? COLLISION_GROUPS.ENEMY << 16 | (COLLISION_GROUPS.PLAYER | COLLISION_GROUPS.WORLD | COLLISION_GROUPS.ENEMY)
            : COLLISION_GROUPS.PLAYER << 16 | (COLLISION_GROUPS.PLAYER | COLLISION_GROUPS.WORLD | COLLISION_GROUPS.ENEMY);

        const bodyD = remote
            ? RAPIER.RigidBodyDesc.kinematicPositionBased()
            : RAPIER.RigidBodyDesc.dynamic()
        bodyD.lockRotations();
        bodyD.setLinearDamping(0);
        bodyD.setAngularDamping(0);
        const body = this.world.createRigidBody(bodyD);
        body.setTranslation(actor.vecPos, true);

        let colliderD: RAPIER.ColliderDesc;
        switch (shape) {
            case "capsule":
                colliderD = RAPIER.ColliderDesc.capsule(height / 2, radius)
                break;
            default:
                throw new Error("no shape");
        }
        colliderD.setCollisionGroups(collideGroup);
        colliderD.setFriction(0);
        colliderD.setRestitution(0);

        const collider = this.world.createCollider(colliderD, body);
        if (mass !== undefined) collider.setMass(mass);

        actor.body = body;
        actor.collider = collider;

        return { body, collider };
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
