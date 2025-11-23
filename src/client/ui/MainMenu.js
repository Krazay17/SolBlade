import "../css/StyleMenu.css";

import Input from "../core/Input";

export default class MainMenu {
    /**
     * 
     * @param {Input} input 
     */
    constructor(input) {
        this.input = input;

        this.active = false;
        this.ui = this.init();
        MainMenu.ui = this.ui;
        this.toggle();
    }
    init() {
        const root = document.createElement('div');
        root.id = 'menu-section';
        document.body.appendChild(root);

        const buttonGrid = document.createElement('div');
        buttonGrid.classList.add('menu-button-grid');
        MainMenu.buttonGrid = buttonGrid;
        const closeButton = document.createElement('button');
        closeButton.classList.add('close-button');

        root.append(buttonGrid, closeButton);
        return root;
    }
    toggle() {
        if (!this.active) {
            this.ui.style.display = 'grid';
        } else {
            this.ui.style.display = 'none';
        }
        this.active = !this.active;
    }
}

export function menuButton(text = 'Button', callback = () => { }) {
    const button = document.createElement('button');
    button.classList.add('menu-button');
    button.innerText = text;
    button.addEventListener('click', callback);
    MainMenu.buttonGrid.appendChild(button);
    return button;
}
export function menuSlider(text = 'Slider', min = 0, max = 1, step = 0.1, callback = () => { }) {
    const slider = document.createElement('input');
    slider.classList.add('menu-slider');
    slider.addEventListener('mousedown', (e) => {
        e.stopPropagation();
    })
    slider.type = 'range';
    slider.min = min;
    slider.max = max;
    slider.step = step;
    slider.value = min;
    const label = document.createElement('p');
    label.innerText = text;
    slider.addEventListener('input', (e) => {
        const value = e.target.value;
        label.innerText = `${text}: ${value}`;
        callback(value);
    });

    MainMenu.ui.appendChild(slider);
    MainMenu.ui.appendChild(label);
    return { slider, label };
}