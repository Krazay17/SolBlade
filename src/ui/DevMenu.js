import Globals from "../utils/Globals";
import { lerp } from "three/src/math/MathUtils.js";

export default class DevMenu {
    constructor(actor, movementComp) {
        this.actor = actor;
        this.movementComp = movementComp;
        this.movementValues = movementComp.values;

        this.isOpen = false;

        this.section = document.createElement('div');
        this.section.id = 'devSection';
        this.groundGrid = document.createElement('div');
        this.groundGrid.classList.add('devGrid');
        this.airGrid = document.createElement('div');
        this.airGrid.classList.add('devGrid');
        this.bladeGrid = document.createElement('div');
        this.bladeGrid.classList.add('devGrid');
        this.attackGrid = document.createElement('div');
        this.attackGrid.classList.add('devGrid');

        window.addEventListener('keydown', (event) => {
            if (Globals.input.inputBlocked) return;
            if (event.code === 'KeyN') {
                this.isOpen = !this.isOpen;
                if (this.isOpen) {
                    this.open();
                    document.exitPointerLock();
                } else {
                    this.close();
                }
            }
        });

        const frictionMax = 20;
        const accelMax = 15;
        const speedMax = 20;
        const tapMax = 1;
        this.movementSliders = {
            idleFriction: this.createSlider('Idle Friction', this.groundGrid, this.movementValues.idle.friction, frictionMax,
                (name, value, label) => {
                    this.movementValues.idle.friction = lerp(0, frictionMax, value / 100);
                    label.innerText = `${name}: ${this.movementValues.idle.friction.toFixed(2)}`;
                }),
            groundFriction: this.createSlider('Ground Friction', this.groundGrid, this.movementValues.ground.friction, frictionMax,
                (name, value, label) => {
                    this.movementValues.ground.friction = lerp(0, frictionMax, value / 100);
                    label.innerText = `${name}: ${this.movementValues.ground.friction.toFixed(2)}`;
                }),
            groundAccel: this.createSlider('Ground Accel', this.groundGrid, this.movementValues.ground.accel, accelMax,
                (name, value, label) => {
                    this.movementValues.ground.accel = lerp(0, accelMax, value / 100);
                    label.innerText = `${name}: ${this.movementValues.ground.accel.toFixed(2)}`;
                }),
            groundSpeed: this.createSlider('Ground Speed', this.groundGrid, this.movementValues.ground.speed, speedMax,
                (name, value, label) => {
                    this.movementValues.ground.speed = lerp(0, speedMax, value / 100);
                    label.innerText = `${name}: ${this.movementValues.ground.speed.toFixed(2)}`;
                }),
            groundTap: this.createSlider('Ground Tap', this.groundGrid, this.movementValues.ground.tap, tapMax,
                (name, value, label) => {
                    this.movementValues.ground.tap = lerp(0, tapMax, value / 100);
                    label.innerText = `${name}: ${this.movementValues.ground.tap.toFixed(2)}`;
                }),
            airFriction: this.createSlider('Air Friction', this.airGrid, this.movementValues.air.friction, frictionMax,
                (name, value, label) => {
                    this.movementValues.air.friction = lerp(0, frictionMax, value / 100);
                    label.innerText = `${name}: ${this.movementValues.air.friction.toFixed(2)}`;
                }),
            airAccel: this.createSlider('Air Accel', this.airGrid, this.movementValues.air.accel, accelMax,
                (name, value, label) => {
                    this.movementValues.air.accel = lerp(0, accelMax, value / 100);
                    label.innerText = `${name}: ${this.movementValues.air.accel.toFixed(2)}`;
                }),
            airSpeed: this.createSlider('Air Speed', this.airGrid, this.movementValues.air.speed, speedMax,
                (name, value, label) => {
                    this.movementValues.air.speed = lerp(0, speedMax, value / 100);
                    label.innerText = `${name}: ${this.movementValues.air.speed.toFixed(2)}`;
                }),
            airTap: this.createSlider('Air Tap', this.airGrid, this.movementValues.air.tap, tapMax,
                (name, value, label) => {
                    this.movementValues.air.tap = lerp(0, tapMax, value / 100);
                    label.innerText = `${name}: ${this.movementValues.air.tap.toFixed(2)}`;
                }),
            bladeFriction: this.createSlider('Blade Friction', this.bladeGrid, this.movementValues.blade.friction, frictionMax,
                (name, value, label) => {
                    this.movementValues.blade.friction = lerp(0, frictionMax, value / 100);
                    label.innerText = `${name}: ${this.movementValues.blade.friction.toFixed(2)}`;
                }),
            bladeAccel: this.createSlider('Blade Accel', this.bladeGrid, this.movementValues.blade.accel, accelMax,
                (name, value, label) => {
                    this.movementValues.blade.accel = lerp(0, accelMax, value / 100);
                    label.innerText = `${name}: ${this.movementValues.blade.accel.toFixed(2)}`;
                }),
            bladeSpeed: this.createSlider('Blade Speed', this.bladeGrid, this.movementValues.blade.speed, speedMax,
                (name, value, label) => {
                    this.movementValues.blade.speed = lerp(0, speedMax, value / 100);
                    label.innerText = `${name}: ${this.movementValues.blade.speed.toFixed(2)}`;
                }),
            bladeTap: this.createSlider('Blade Tap', this.bladeGrid, this.movementValues.blade.tap, tapMax,
                (name, value, label) => {
                    this.movementValues.blade.tap = lerp(0, tapMax, value / 100);
                    label.innerText = `${name}: ${this.movementValues.blade.tap.toFixed(2)}`;
                }),
            attackFriction: this.createSlider('Attack Friction', this.attackGrid, this.movementValues.attack.friction, frictionMax,
                (name, value, label) => {
                    this.movementValues.attack.friction = lerp(0, frictionMax, value / 100);
                    label.innerText = `${name}: ${this.movementValues.attack.friction.toFixed(2)}`;
                }),
            attackAccel: this.createSlider('Attack Accel', this.attackGrid, this.movementValues.attack.accel, accelMax,
                (name, value, label) => {
                    this.movementValues.attack.accel = lerp(0, accelMax, value / 100);
                    label.innerText = `${name}: ${this.movementValues.attack.accel.toFixed(2)}`;
                }),
            attackSpeed: this.createSlider('Attack Speed', this.attackGrid, this.movementValues.attack.speed, speedMax,
                (name, value, label) => {
                    this.movementValues.attack.speed = lerp(0, speedMax, value / 100);
                    label.innerText = `${name}: ${this.movementValues.attack.speed.toFixed(2)}`;
                }),
            attackTap: this.createSlider('Attack Tap', this.attackGrid, this.movementValues.attack.tap, tapMax,
                (name, value, label) => {
                    this.movementValues.attack.tap = lerp(0, tapMax, value / 100);
                    label.innerText = `${name}: ${this.movementValues.attack.tap.toFixed(2)}`;
                }),

        };

        this.section.appendChild(this.groundGrid);
        this.section.appendChild(this.airGrid);
        this.section.appendChild(this.bladeGrid);
        this.section.appendChild(this.attackGrid);
        document.body.appendChild(this.section);
    }

    open() {
        this.section.style.display = 'grid';
    }

    close() {
        this.section.style.display = 'none';
    }

    createSlider(name, grid, initialValue, maxValue, callback) {
        const scaledInitialValue = initialValue / maxValue * 100;
        const label = document.createElement('label');
        label.classList.add('devLabel');
        label.innerText = `${name}: ${initialValue}`;
        const slider = document.createElement('input');
        slider.classList.add('devSlider');
        slider.type = 'range';
        slider.min = 0;
        slider.max = 100;
        slider.value = scaledInitialValue;
        grid.appendChild(label);
        grid.appendChild(slider);

        slider.oninput = () => {
            const value = slider.value;
            callback(name, value, label);
        };
        return slider;
    }
}