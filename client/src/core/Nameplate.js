import * as THREE from 'three';
import MyEventEmitter from './MyEventEmitter';

export default class NamePlate extends THREE.Object3D {
    constructor(actor, offset) {
        super();
        this.actor = actor;
        this.name = actor.name;
        this.health = actor.health || 100;
        this.energy = actor.energy;
        this.money = actor.money;

        this.create();
        this.scale.set(1, 0.5, 1);
        this.position.set(0, offset, 0);
        this.actor.add(this);

        this.setHealth(this.health);
    }

    setName(newName) {
        this.name = newName;
        this.nameTexture.image.getContext('2d').clearRect(0, 0, 512, 256);
        this.nameTexture.image.getContext('2d').fillText(this.name, 1, 105);
        this.nameTexture.needsUpdate = true;
    }

    setHealth(newHealth) {
        this.health = newHealth;
        this.healthBarFill.scale.set(Math.max(0, Math.min(1, newHealth / 100)), 0.16, 1);
    }

    setEnergy(newEnergy) {
        this.energy = newEnergy;
        this.energyBarFill.scale.set(Math.max(0, Math.min(1, newEnergy / 100)), 0.07, 1);
    }

    create() {
        const backGround = new THREE.Sprite(new THREE.SpriteMaterial({
            color: 0x000000,
            opacity: 0.5,
        }));
        backGround.scale.set(1, 0.55, 1);
        backGround.center.set(0.5, 0);
        backGround.renderOrder = 9995;
        this.add(backGround);

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.font = '48px Arial';
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 2;
        ctx.fillStyle = 'white';
        ctx.fillText(this.name, 1, 105);

        this.nameTexture = new THREE.Texture(canvas);
        this.nameTexture.needsUpdate = true;

        const name = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.nameTexture }));
        name.scale.set(1, 1, 1);
        name.center.set(0.5, 0);
        name.renderOrder = 9996;
        this.add(name);

        const healthBar = new THREE.Sprite(new THREE.SpriteMaterial({ color: 0xff0000 }));
        healthBar.scale.set(1, 0.16, 1);
        healthBar.position.set(0, 0, 0);
        healthBar.center.set(0.5, -0.2);
        healthBar.renderOrder = 9997;
        this.add(healthBar);
        this.healthBarFill = new THREE.Sprite(new THREE.SpriteMaterial({ color: 0x00ff00 }));
        this.healthBarFill.scale.set(1, 0.16, 1);
        this.healthBarFill.position.set(0, 0, 0);
        this.healthBarFill.center.set(0.5, -0.2);
        this.healthBarFill.renderOrder = 9998;
        this.add(this.healthBarFill);
        const energyBar = new THREE.Sprite(new THREE.SpriteMaterial({ color: 0xff0000 }));
        energyBar.scale.set(1, 0.07, 1);
        energyBar.position.set(0, 0, 0);
        energyBar.center.set(0.5, 0);
        energyBar.renderOrder = 9997;
        this.add(energyBar);
        this.energyBarFill = new THREE.Sprite(new THREE.SpriteMaterial({ color: 0xff00ff }));
        this.energyBarFill.scale.set(1, 0.07, 1);
        this.energyBarFill.position.set(0, 0, 0);
        this.energyBarFill.center.set(0.5, 0);
        this.energyBarFill.renderOrder = 9998;
        this.add(this.energyBarFill);
    }
}