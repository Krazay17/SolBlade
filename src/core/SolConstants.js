export const SOL_PHYSICS_SETTINGS = {
    gravity: { x: 0, y: 9.81, z: 0 },
    serverTick: 1000 / 60,
    substep: 6,
}

export const COLLISION_GROUPS = {
    WORLD: 0b0001,
    PLAYER: 0b0010,
    ENEMY: 0b0100,
    RAY: 0b1000,
};

export const WEAPON_STATS = {
    sword: {
        damage: 40,
        range: 3.4,
        cooldown: 1500
    },
    pistol: {
        damage: 20,
        range: 50,
        cooldown: 900,
    },
    claw: {
        damage: 25,
        range: 2.7,
        cooldown: 900,
    },
    fireball: {
        damage: 18,
        range: 1,
        cooldown: 1250,
    },
    scythe: {
        damage: 33,
        range: 1,
        cooldown: 1666,
    }
}