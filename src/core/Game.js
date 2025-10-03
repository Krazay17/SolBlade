import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import Crosshair from '../ui/Crosshair';
import Input from './Input';
import { setupKeybindWindow, addButton } from '../ui/KeyBinds';
import { getMaterial } from './MaterialManager';
import PlayerInfo from '../ui/PlayerUI';
import MyEventEmitter from './MyEventEmitter';
import Globals from '../utils/Globals';
import soundPlayer from './SoundPlayer';
import { GLTFLoader } from 'three/examples/jsm/Addons.js';
import { CSM } from 'three/examples/jsm/Addons.js';
import LoadingManager from './LoadingManager';

CANNON.Vec3.prototype.clone = function () {
  return new CANNON.Vec3(this.x, this.y, this.z);
}

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
    
    /**@type {LoadingManager} */
    this.loadingManager = new LoadingManager();

    this.renderer = new THREE.WebGLRenderer({ alpha: 0 });
    document.body.appendChild(this.renderer.domElement);

    this.renderer.setSize(window.innerWidth, window.innerHeight);

    this.physicsWorld = new CANNON.World({
      iterations: 20,
      defaultMaterial: getMaterial('defaultMaterial'),
    });
    this.createContactMaterial();
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

    this.audioListener = new THREE.AudioListener();
    this.camera.add(this.audioListener);
    soundPlayer.setPosAudio(this.audioListener);


    this.crosshair = new Crosshair(this.graphicsWorld);

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

  createContactMaterial() {
    const material = getMaterial('pawnMaterial');
    const contactMaterial = new CANNON.ContactMaterial(
      material,
      getMaterial('defaultMaterial'),
      {
        friction: 0,
        restitution: 0,
        contactEquationStiffness: 1e7,
        contactEquationRelaxation: 50,
        frictionEquationStiffness: 1e7,
        frictionEquationRelaxation: 0,
        id: 'pawnGroundContact',
      });
    this.physicsWorld.addContactMaterial(contactMaterial);

    const material2 = getMaterial('pawnMaterial');
    const contactMaterial2 = new CANNON.ContactMaterial(
      material2,
      getMaterial('pawnMaterial'),
      {
        friction: 0,
        restitution: 0,
        contactEquationRelaxation: 100,
        id: 'pawnContact',
      });
    this.physicsWorld.addContactMaterial(contactMaterial2);
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
      MyEventEmitter.emit('update', dt, time);

      this.renderer.render(this.graphicsWorld, this.camera);
    }

    requestAnimationFrame(this.loop.bind(this));
  }

  spawnLights() {
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // this.csm = new CSM({
    //   camera: this.camera,
    //   parent: this.graphicsWorld,
    //   cascades: 4,
    //   maxFar: this.camera.far,
    //   shadowMapSize: 2048,
    //   lightDirection: new THREE.Vector3(1, -1, 1).normalize(),
    // });
    // Globals.csm = this.csm;

    // Directional Light (main sun)
    const dirLight = new THREE.DirectionalLight(0xffffff, .8);
    dirLight.position.set(50, 100, 50);
    const target = new THREE.Vector3().addVectors(dirLight.position, new THREE.Vector3(1, -1, 1).normalize())
    dirLight.lookAt(target);

    dirLight.shadow.camera.left = -150;
    dirLight.shadow.camera.right = 150;
    dirLight.shadow.camera.top = 150;
    dirLight.shadow.camera.bottom = -150;
    dirLight.shadow.camera.near = 1;
    dirLight.shadow.camera.far = 200;

    dirLight.shadow.mapSize.width = 2048 * 4;
    dirLight.shadow.mapSize.height = 2048 * 4;
    dirLight.shadow.bias = -0.0001;
    dirLight.shadow.normalBias = 0.02;


    dirLight.castShadow = true;
    this.graphicsWorld.add(dirLight);
    // Ambient Light
    const ambientLight = new THREE.AmbientLight(0xffffff, .1);
    this.graphicsWorld.add(ambientLight);

    // const helper = new THREE.CameraHelper(dirLight.shadow.camera);
    // this.graphicsWorld.add(helper);

    // Optional helper to see light direction
    // const lightHelper = new THREE.DirectionalLightHelper(dirLight, 1);
    // this.threeScene.add(lightHelper);
  }

  makeKeybindWindow() {
    setupKeybindWindow()
  }
}
