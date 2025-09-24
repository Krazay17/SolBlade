import * as THREE from 'three';

export default {
    game: null,
    graphicsWorld: new THREE.Scene(),
    physicsWorld: null,
    player: null,
    playerInfo: null,
    scene: null,
    input: null,
    camera: null,
    DEBUG: false,
    socket: null,
    enemyActors: [],
    mapWalls: [],
}