import MyEventEmitter from "../core/MyEventEmitter";

export default class Inventory {
    constructor(actor) {
        this.actor = actor;
        this.items = [];
        this.active = false;

        this.inventoryUI = null;
        this.equippedUI = null;
        this.itemsUI = null;
        this.spellUI = null;
        this.spellSlot1 = null;
        this.spellSlot2 = null;
        this.spellSlot3 = null;
        this.spellSlot4 = null;
        this.spellSlot1CD = null;
        this.spellSlot2CD = null;
        this.spellSlot3CD = null;
        this.spellSlot4CD = null;

        this.createInventoryUI();
        this.addItem('Fireball', 'assets/Fireball.png');
        this.addItem('Fireball', 'assets/Fireball.png');
        this.addItem('Fireball', 'assets/Fireball.png');
        this.addItem('Fireball', 'assets/Fireball.png');
        this.addItem('Sword', 'assets/Sword.png');
        this.addItem('Sword', 'assets/Sword.png');
        this.addItem('Sword', 'assets/Sword.png');
        this.addItem('Sword', 'assets/Sword.png');
        this.bindEvents();
    }
    bindEvents() {
        MyEventEmitter.on('openInventory', () => {
            this.toggleInventory();
        })
        MyEventEmitter.on('spellUsed', ({ slot, cd }) => {
            const cdEl = this[`spellSlot${slot}CD`]; // e.g. this.spellSlot1CD
            if (!cdEl) return;
            console.log(`Starting cooldown animation for slot ${slot} with duration ${cd}ms`);

            // reset any running animation
            cdEl.style.animation = 'none';

            // force a reflow so the 'none' takes effect (guarantees restart)
            void cdEl.offsetWidth;

            // start the cooldown animation with the correct duration
            cdEl.style.animation = `cooldownAnim ${cd}ms linear forwards`;
            console.log(cdEl.style.animation);
        });
    }

    toggleInventory() {
        this.active = !this.active;
        if (this.active) {
            document.exitPointerLock();
        }
        this.inventoryUI.style.display = this.active ? 'block' : 'none';
        MyEventEmitter.emit('inventoryToggled', this.active);
    }

    addItem(name, img) {
        const item = this.createItem(name, img);
        this.items.push(item);
        this.itemsUI.appendChild(item);
    }

    createItem(name, img) {
        const slot = document.createElement('div');
        slot.className = 'inventory-slot';
        const item = document.createElement('div');
        item.className = 'item';
        item.draggable = true;
        item.dataset.item = name;
        item.dataset.img = img;

        const label = document.createElement('div');
        label.className = 'item-label';
        label.innerText = name;

        const icon = document.createElement('div');
        icon.className = 'item-icon';
        icon.style.backgroundImage = `url(${img})`;

        item.appendChild(icon);
        item.appendChild(label);
        slot.appendChild(item);

        return slot;
    }

    createInventoryUI() {
        this.inventoryUI = document.createElement('div');
        this.inventoryUI.id = 'inventory-ui';
        document.body.appendChild(this.inventoryUI);

        this.equippedUI = document.createElement('div');
        this.equippedUI.id = 'inventory-equipped';
        this.inventoryUI.appendChild(this.equippedUI);

        this.itemsUI = document.createElement('div');
        this.itemsUI.id = 'inventory-items';
        this.inventoryUI.appendChild(this.itemsUI);
        setupDragAndDrop(this.itemsUI, this.actor);

        this.spellUI = document.createElement('div');
        this.spellUI.id = 'spell-ui';
        document.body.appendChild(this.spellUI);
        setupDragAndDrop(this.spellUI, this.actor);

        // create 4 slots + CD overlays and keep references like this.spellSlot1CD
        for (let i = 1; i <= 4; i++) {
            const container = document.createElement('div');
            container.className = 'spell-slot-container';

            const slot = document.createElement('div');
            slot.className = 'spell-slot';
            slot.id = String(i);
            container.appendChild(slot);

            const cd = document.createElement('div');
            cd.className = 'spell-cd';        // overlay element
            container.appendChild(cd);

            this.spellUI.appendChild(container);

            // store reference to each CD overlay for later
            this[`spellSlot${i}CD`] = cd;
        }

    }
}

export function setupDragAndDrop(container, actor) {
    container.addEventListener("dragstart", (e) => {
        const spell = e.target.closest(".item");
        if (!spell) return;
        e.dataTransfer.setData("application/json", JSON.stringify({
            name: spell.dataset.item,
            img: spell.dataset.img
        }));
        e.dataTransfer.effectAllowed = "move";
        e.target.classList.add("dragging");
    });

    container.addEventListener("dragend", (e) => {
        e.target.classList.remove("dragging");
    });

    container.addEventListener("dragover", (e) => {
        e.preventDefault();
        const slot = e.target.closest(".spell-slot")
            || e.target.closest(".inventory-slot");
        if (slot) slot.classList.add("drag-over");
    });

    container.addEventListener("dragleave", (e) => {
        const slot = e.target.closest(".spell-slot")
            || e.target.closest(".inventory-slot");
        if (slot) slot.classList.remove("drag-over");
    });

    container.addEventListener("drop", (e) => {
        e.preventDefault();
        const slot = e.target.closest(".spell-slot")
            || e.target.closest(".inventory-slot");
        if (!slot) return;
        slot.classList.remove("drag-over");

        const data = JSON.parse(e.dataTransfer.getData("application/json"));
        const dragged = document.querySelector(`.item.dragging`);
        if (!dragged) return;

        const originalParent = dragged.parentElement;
        const slotFull = slot.firstChild;

        // If the slot is full, move the existing item back to inventory or original position
        if (slotFull) {
            const slotFullData = slotFull.dataset.item ? {
                name: slotFull.dataset.item,
                img: slotFull.dataset.img
            } : null;
            if (originalParent === slot) return; // same slot, do nothing
            if (originalParent.classList.contains("spell-slot")) {
                slotFull.classList.add("spell");
                originalParent.appendChild(slotFull);
                actor.setSpell(originalParent.id, slotFullData);
            } else if (originalParent.classList.contains("inventory-slot")) {
                slotFull.classList.remove("spell");
                originalParent.appendChild(slotFull);
            }
        } else if (originalParent.classList.contains("spell-slot")) {
            // Clear the original slot if moving from one slot to another
            originalParent.innerHTML = "";
            actor.setSpell(originalParent.id, null);
        }

        if (slot.classList.contains("spell-slot")) {
            // Move into the spell slot
            //slot.innerHTML = ""; // clear old contents
            dragged.classList.remove("dragging");
            dragged.classList.add("spell");
            slot.appendChild(dragged);
            actor.setSpell(slot.id, data);
        } else if (slot.classList.contains("inventory-slot")) {
            // Move back to inventory
            dragged.classList.remove("spell");
            slot.appendChild(dragged);
        }
    });
}