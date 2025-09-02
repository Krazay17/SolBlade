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
                (value) => {
                    this.movementValues.idle.friction = value;
                    return this.movementValues.idle.friction;
                }),
            groundFriction: this.createSlider('Ground Friction', this.groundGrid, this.movementValues.ground.friction, frictionMax,
                (value) => {
                    this.movementValues.ground.friction = value;
                    return this.movementValues.ground.friction;
                }),
            groundAccel: this.createSlider('Ground Accel', this.groundGrid, this.movementValues.ground.accel, accelMax,
                (value) => {
                    this.movementValues.ground.accel = value;
                    return this.movementValues.ground.accel;
                }),
            groundSpeed: this.createSlider('Ground Speed', this.groundGrid, this.movementValues.ground.speed, speedMax,
                (value) => {
                    this.movementValues.ground.speed = value;
                    return this.movementValues.ground.speed;
                }),
            groundTap: this.createSlider('Ground Tap', this.groundGrid, this.movementValues.ground.tap, tapMax,
                (value) => {
                    this.movementValues.ground.tap = value;
                    return this.movementValues.ground.tap;
                }),
            airFriction: this.createSlider('Air Friction', this.airGrid, this.movementValues.air.friction, frictionMax,
                (value) => {
                    this.movementValues.air.friction = value;
                    return this.movementValues.air.friction;
                }),
            airAccel: this.createSlider('Air Accel', this.airGrid, this.movementValues.air.accel, accelMax,
                (value) => {
                    this.movementValues.air.accel = value;
                    return this.movementValues.air.accel;
                }),
            airSpeed: this.createSlider('Air Speed', this.airGrid, this.movementValues.air.speed, speedMax,
                (value) => {
                    this.movementValues.air.speed = value;
                    return this.movementValues.air.speed;
                }),
            airTap: this.createSlider('Air Tap', this.airGrid, this.movementValues.air.tap, tapMax,
                (value) => {
                    this.movementValues.air.tap = value;
                    return this.movementValues.air.tap;
                }),
            bladeFriction: this.createSlider('Blade Friction', this.bladeGrid, this.movementValues.blade.friction, frictionMax,
                (value) => {
                    this.movementValues.blade.friction = value;
                    return this.movementValues.blade.friction;
                }),
            bladeAccel: this.createSlider('Blade Accel', this.bladeGrid, this.movementValues.blade.accel, accelMax,
                (value) => {
                    this.movementValues.blade.accel = value;
                    return this.movementValues.blade.accel;
                }),
            bladeSpeed: this.createSlider('Blade Speed', this.bladeGrid, this.movementValues.blade.speed, speedMax,
                (value) => {
                    this.movementValues.blade.speed = value;
                    return this.movementValues.blade.speed;
                }),
            bladeTap: this.createSlider('Blade Tap', this.bladeGrid, this.movementValues.blade.tap, tapMax,
                (value) => {
                    this.movementValues.blade.tap = value;
                    return this.movementValues.blade.tap;
                }),
            attackFriction: this.createSlider('Attack Friction', this.attackGrid, this.movementValues.attack.friction, frictionMax,
                (value) => {
                    this.movementValues.attack.friction = value;
                    return this.movementValues.attack.friction;
                }),
            attackAccel: this.createSlider('Attack Accel', this.attackGrid, this.movementValues.attack.accel, accelMax,
                (value) => {
                    this.movementValues.attack.accel = value;
                    return this.movementValues.attack.accel;
                }),
            attackSpeed: this.createSlider('Attack Speed', this.attackGrid, this.movementValues.attack.speed, speedMax,
                (value) => {
                    this.movementValues.attack.speed = value;
                    return this.movementValues.attack.speed;
                }),
            attackTap: this.createSlider('Attack Tap', this.attackGrid, this.movementValues.attack.tap, tapMax,
                (value) => {
                    this.movementValues.attack.tap = value;
                    return this.movementValues.attack.tap;
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
        const labelGrid = document.createElement('div');
        const label = document.createElement('label');
        label.classList.add('devLabel');
        label.innerText = `${name}: `;
        const valueDisplay = document.createElement('input');
        valueDisplay.classList.add('devLabel');
        valueDisplay.value = `${initialValue}`;
        const slider = document.createElement('input');
        slider.classList.add('devSlider');
        slider.type = 'range';
        slider.step = '0.01';
        slider.min = 0;
        slider.max = maxValue;
        slider.value = initialValue;
        labelGrid.appendChild(label);
        labelGrid.appendChild(valueDisplay);
        grid.appendChild(labelGrid);
        grid.appendChild(slider);

        valueDisplay.onchange = () => {
            const value = parseFloat(valueDisplay.value);
            if (!isNaN(value) && typeof value === 'number') {
                slider.value = callback(value);
            }
        };

        slider.oninput = () => {
            const value = parseFloat(slider.value);
            valueDisplay.value = callback(value);
        };
        return slider;
    }

}