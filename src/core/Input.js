import { setupKeybindWindow, addButton } from "../ui/KeyBinds";
import MyEventEmitter from "./MyEventEmitter";

export default class Input {
  constructor(actor, domElement = document.body) {
    this.actor = actor;
    this.domElement = domElement;
    this.gameElement = document.getElementById('webgl');

    this.pointerLocked = false;
    this.sensitivity = 0.002;
    this.moveSpeed = 5;

    this.yaw = 0;
    this.pitch = 0;
    this.keys = {};
    this.mice = {};
    this.lockMouse = false;
    this.inputBlocked = false;

    document.addEventListener('pointerlockchange', () => {
      this.pointerLocked = (document.pointerLockElement === this.gameElement);
    });
    document.addEventListener('pointerlockerror', () => {
      console.error('Pointer lock failed');
    });

    this.bindings();
    setupKeybindWindow();
    this.addKeys();
  }

  bindings() {
    this.domElement.addEventListener('keypress', (e) => {
      if (this.inputBlocked) return;
      MyEventEmitter.emit('KeyPressed', e.code);
    });
    this.domElement.addEventListener('keydown', (e) => {
      if (this.inputBlocked) return;
      this.keys[e.code] = true;
      MyEventEmitter.emit('playerMove');
    });
    this.domElement.addEventListener('keyup', (e) => {
      if (this.inputBlocked) return;
      this.keys[e.code] = false;
    });
    this.domElement.addEventListener('mousedown', (e) => {
      if (this.gameElement === e.target) {
        this.gameElement.requestPointerLock();
      }
      this.mice[e.button] = true;
    });
    this.domElement.addEventListener('mouseup', (e) => {
      this.mice[e.button] = false;
    });

    this.domElement.addEventListener('mousemove', (e) => {
      if (this.gameElement === document.pointerLockElement) {
        this.yaw -= e.movementX * this.sensitivity;
        this.pitch -= e.movementY * this.sensitivity;
        this.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.pitch));
      }
    });
  }

  addKeys() {
    addButton('KeyUnpressed', 'KeyW', 'Fwd', 1, 2);
    addButton('KeyUnpressed', 'KeyS', 'Bwd', 2, 2);
    addButton('KeyUnpressed', 'KeyA', 'Left', 2, 1);
    addButton('KeyUnpressed', 'KeyD', 'Right', 2, 3);
    addButton('KeyUnpressed', 'ShiftLeft', 'Dash', 2, 4, '100px', 'Shift');
    addButton('KeyUnpressed', 'Space', 'Jump', 2, 6, '140px');
    //addButton('KeyUnpressed', 'KeyF', 'Interact', 2, 9);
    addButton('KeyUnpressed', 'KeyB', 'Menu', 2, 10);
    addButton('KeyUnpressed', 'KeyT', 'Pause', 1, 10);
    addButton('KeyUnpressed', 'KeyR', 'Respawn', 1, 9);
  }
}