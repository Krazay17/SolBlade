interface ActorTypeData {
    anims: string[];
    abilities: string[];
    mesh: string;
    physics: PhysicsConfig;
}
interface PhysicsConfig {
    shape: "capsule" | "box";
    mass: number;
    height?: number;
    radius?: number;
}

export const actorType: Record<string, ActorTypeData> = {
    player: {
        anims:['run', 'fall'],
        abilities: ['fireball'],
        mesh: "spikeMan",
        physics: { shape: "capsule", mass: 1, height: 1, radius: 0.5 }
    },
    wizard: {
        anims: ['run', 'fall'],
        abilities: ['fireball'],
        mesh: "Wizard",
        physics: { shape: "capsule", mass: 1, height: 1, radius: 0.5 }
    }
}