import * as THREE from 'three';
import * as CANNON from 'cannon';
import LocalData from './LocalData';
import Input from './Input';
import { setupKeybindWindow, addButton } from '../ui/KeyBinds';
import { getMaterial } from './MaterialManager';
import PlayerInfo from '../ui/PlayerUI';
import MyEventEmitter from './MyEventEmitter';
import Globals from '../utils/Globals';

export default class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = null;

    this.settings = {
      timeStep: 1 / 120,
      subStep: 6,
    }

    this.running = true;
    this.lastTime = 0;

    this.renderer = new THREE.WebGLRenderer({ alpha: 0 });
    document.body.appendChild(this.renderer.domElement);

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.physicsWorld = new CANNON.World({
      iterations: 20,
      defaultMaterial: getMaterial('defaultMaterial'),
    });
    this.physicsWorld.gravity = new CANNON.Vec3(0, -15, 0);
    this.timeStep = 1 / 120;

    this.graphicsWorld = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
      80,
      window.innerWidth / window.innerHeight,
      0.1,
      5000
    );
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));

    this.spawnLights();

    this.input = new Input(canvas);
    this.playerInfo = new PlayerInfo();
    Globals.playerInfo = this.playerInfo;

    //this.setScene(LocalData.scene);
    this.initWindow();

    MyEventEmitter.on('KeyPressed', (key) => {
      if (key === 'KeyT') {
        this.running = !this.running;
      }
    })

    //this.localPlayer = new Player(this, null, {})
    Globals.game = this;
    Globals.graphicsWorld = this.graphicsWorld;
    Globals.physicsWorld = this.physicsWorld;
    Globals.input = this.input;
    Globals.camera = this.camera;
  }

  initWindow() {
    window.addEventListener('resize', () => {
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
    });
  }

  setScene(scene) {
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
      this.physicsWorld.step(this.timeStep, dt, 6);
      this.scene.update(dt, time);
      MyEventEmitter.emit('postUpdate', dt, time);
      
      this.renderer.render(this.graphicsWorld, this.camera);
    }

    requestAnimationFrame(this.loop.bind(this));
  }

  spawnLights() {
    // Directional Light (main sun)
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(5, 100, 5);
    // Make shadow area much bigger
    dirLight.shadow.camera.left = -150;
    dirLight.shadow.camera.right = 150;
    dirLight.shadow.camera.top = 150;
    dirLight.shadow.camera.bottom = -50;
    dirLight.shadow.camera.near = 1;
    dirLight.shadow.camera.far = 200;

    // Increase resolution for better quality
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;

    dirLight.castShadow = true;
    this.graphicsWorld.add(dirLight);

    // Ambient Light
    const ambientLight = new THREE.AmbientLight(0xffffff, .1);
    this.graphicsWorld.add(ambientLight);

    // Optional: see shadow frustum
    // const helper = new THREE.CameraHelper(dirLight.shadow.camera);
    // this.threeScene.add(helper);

    // Optional helper to see light direction
    // const lightHelper = new THREE.DirectionalLightHelper(dirLight, 1);
    // this.threeScene.add(lightHelper);
  }

  makeKeybindWindow() {
    setupKeybindWindow()
  }
}
