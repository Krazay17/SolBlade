import * as THREE from 'three';
import { World } from 'cannon-es';
import GameScene from '../scenes/GameScene';
import { CSM } from 'three/examples/jsm/Addons.js';

export default {
    game: null,
    /**@type {THREE.Scene} */
    graphicsWorld: null,
    /**@type {World} */
    physicsWorld: null,
    player: null,
    playerInfo: null,
    /**@type {GameScene} */
    scene: null,
    input: null,
    camera: null,
    DEBUG: false,
    socket: null,
    enemyActors: [],
    mapWalls: [],
    /**@type {CSM} */
    csm: null,
}