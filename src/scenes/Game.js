import * as THREE from 'three';
import * as RAPIER from '@dimforge/rapier3d-compat';
import Crosshair from '../ui/Crosshair';
import Input from '../core/Input';
import { setupKeybindWindow, addButton } from '../ui/KeyBinds';
import PlayerInfo from '../ui/PlayerUI';
import MyEventEmitter from '../core/MyEventEmitter';
import Globals from '../utils/Globals';
import soundPlayer from '../core/SoundPlayer';
import LoadingManager from '../core/LoadingManager';
import World1 from './World1';
import World2 from './World2';
import LocalData from '../core/LocalData';
import World3 from './World3';
import MeshManager from '../core/MeshManager';
import Player from '../player/Player';

await RAPIER.init();

const mapMap = new Map([
  ['world1', World1],
  ['world2', World2],
  ['world3', World3],
]);

export default class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = null;

    this.settings = {
      timeStep: 1 / 120,
      subStep: 6,
    }

    this.initWindow();
    this.running = true;
    this.lastTime = 0;
    this.accumulator = 0;
    this.timeStep = 1 / 120;


    this.renderer = new THREE.WebGLRenderer({ alpha: 0 });
    document.body.appendChild(this.renderer.domElement);
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    this.rapierWorld = new RAPIER.World({ x: 0, y: -6, z: 0 });
    this.graphicsWorld = new THREE.Scene();
    /**@type {LoadingManager} */
    this.loadingManager = new LoadingManager();
    this.meshManager = new MeshManager(this);

    this.camera = new THREE.PerspectiveCamera(
      80,
      window.innerWidth / window.innerHeight,
      0.1,
      5000
    );
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));

    this.audioListener = new THREE.AudioListener();
    this.camera.add(this.audioListener);
    soundPlayer.setPosAudio(this.audioListener);

    this.input = new Input(canvas);
    this.playerInfo = new PlayerInfo();
    Globals.playerInfo = this.playerInfo;

    this.crosshair = new Crosshair(this.graphicsWorld);

    this.worldLight();

    Globals.game = this;
    Globals.graphicsWorld = this.graphicsWorld;
    Globals.physicsWorld = this.physicsWorld;
    Globals.input = this.input;
    Globals.camera = this.camera;

    const scene = mapMap.get(LocalData.solWorld || 'world1')
    const newScene = new scene(this);
    this.setScene(newScene);


    this.start();
  }

  initWindow() {
    window.addEventListener('resize', () => {
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
    });
  }

  setScene(scene) {
    if (typeof scene === String) {
      const newMap = mapMap.get(scene);
      scene = new newMap(this);
    }
    if (this.scene?.onExit) this.scene.onExit();
    this.scene = scene;
    if (this.scene?.onEnter) this.scene.onEnter();
  }

  start() {
    requestAnimationFrame(this.loop.bind(this));
  }

  loop(time) {
    const dt = (time - this.lastTime) / 1000;
    this.lastTime = time;

    if (this.running && this.scene) {
      MyEventEmitter.emit('preUpdate', dt, time);

      this.accumulator += dt;
      while (this.accumulator >= this.timeStep) {
        this.rapierWorld.step();

        this.scene?.fixedUpdate?.(dt, time);
        this.accumulator -= this.timeStep;
      }
      this.scene?.update?.(dt, time);

      MyEventEmitter.emit('update', dt, time);
      this.renderer.render(this.graphicsWorld, this.camera);
    }

    requestAnimationFrame(this.loop.bind(this));
  }

  worldLight() {
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    const dirLight = new THREE.DirectionalLight(0xffffff, .66);
    dirLight.position.set(50, 100, 50);
    const target = new THREE.Vector3().addVectors(dirLight.position, new THREE.Vector3(1, -1, 1).normalize())
    dirLight.lookAt(target);

    dirLight.shadow.camera.left = -150;
    dirLight.shadow.camera.right = 150;
    dirLight.shadow.camera.top = 150;
    dirLight.shadow.camera.bottom = -150;
    dirLight.shadow.camera.near = 1;
    dirLight.shadow.camera.far = 200;

    // dirLight.shadow.mapSize.width = 2048 * 2;
    // dirLight.shadow.mapSize.height = 2048 * 2;
    dirLight.shadow.mapSize.width = 512;
    dirLight.shadow.mapSize.height = 512;
    dirLight.shadow.bias = -0.0001;
    dirLight.shadow.normalBias = 0.02;

    dirLight.castShadow = true;
    this.graphicsWorld.add(dirLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, .025);
    this.graphicsWorld.add(ambientLight);
  }

  makeKeybindWindow() {
    setupKeybindWindow()
  }
}
