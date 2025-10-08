import * as THREE from 'three';
import GameScene from '../scenes/GameScene';
import { CSM } from 'three/examples/jsm/Addons.js';

export default {
    game: null,
    /**@type {THREE.Scene} */
    graphicsWorld: null,
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