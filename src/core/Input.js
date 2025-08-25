import { setupKeybindWindow, addButton } from "../ui/KeyBinds";

export default class Input {
  constructor(actor, domElement = document.body) {
    this.actor = actor;
    this.domElement = domElement;
    this.gameElement = document.getElementById('webgl');

    this.sensitivity = 0.002;
    this.moveSpeed = 5;

    this.yaw = 0;
    this.pitch = 0;
    this.keys = {};
    this.mice = {};
    this.lockMouse = false;

    this.bindings();
    setupKeybindWindow();
    this.addKeys();
  }

  bindings() {
    this.domElement.addEventListener('keydown', (ev) => {
      this.keys[ev.code] = true;
    });
    this.domElement.addEventListener('keyup', (ev) => {
      this.keys[ev.code] = false;
    });
    this.domElement.addEventListener('mousedown', (ev) => {
      this.mice[ev.button] = true;
      this.gameElement.requestPointerLock();
    });
    this.domElement.addEventListener('mouseup', (ev) => {
      this.mice[ev.button] = false;
    });

    this.domElement.addEventListener('mousemove', (ev) => {
      if (this.gameElement === document.pointerLockElement) {
        this.yaw -= ev.movementX * this.sensitivity;
        this.pitch -= ev.movementY * this.sensitivity;
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
    addButton('KeyUnpressed', 'KeyF', 'Interact', 2, 9);
    addButton('KeyUnpressed', 'KeyC', 'Inventory', 2, 10);
    addButton('KeyUnpressed', 'KeyT', 'Home', 1, 10);
    addButton('KeyUnpressed', 'KeyR', 'Respawn', 1, 9);
  }
}
