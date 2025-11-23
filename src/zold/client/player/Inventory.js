import LocalData from "../../../client/core/LocalData";
import MyEventEmitter from "../../../common/core/MyEventEmitter";
import { makeRandomItem } from "../../old/shared/Item";

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
        this.bindEvents();
        this.initItems();

        this.addCards(1);
    }
    initItems() {
        LocalData.items.forEach(i => {
            this.addItem(i);
        })
    }
    bindEvents() {
        MyEventEmitter.on('openInventory', () => {
            this.toggleInventory();
        })
        // Cooldown visual on spell button
        MyEventEmitter.on('spellUsed', ({ slot, cd }) => {
            const cdEl = this[`spellSlot${slot}CD`]; // e.g. this.spellSlot1CD
            if (!cdEl) return;

            // reset any running animation
            cdEl.style.animation = 'none';

            // force a reflow so the 'none' takes effect (guarantees restart)
            void cdEl.offsetWidth;

            // start the cooldown animation with the correct duration
            cdEl.style.animation = `cooldownAnim ${cd}ms linear forwards`;
        });
    }
    toggleInventory() {
        this.active = !this.active;
        if (this.active) {
            document.exitPointerLock();
        } else {
            const slots = [...this.itemsUI.getElementsByClassName('inventory-slot')];
            const emptySlots = slots.filter(s => !s.firstChild);
            if (emptySlots) {
                emptySlots.forEach(s => this.itemsUI.removeChild(s));
            }

        }
        this.inventoryUI.style.display = this.active ? 'block' : 'none';
        MyEventEmitter.emit('inventoryToggled', this.active);
    }
    sortInventory() {
        this.inventoryUI.innerHTML = '';
        const invSlots = this.inventoryUI.getElementsByClassName('inventory-slot');

        invSlots.sort((a, b) => a.firstChild.name.charCodeAt(0) < b.firstChild.name.charCodeAt(0));
    }
    createInventorySlot() {
        const slot = document.createElement('div');
        slot.className = 'inventory-slot';
        return slot;
    }
    aquireItem(item) {
        LocalData.addItem(item);
        LocalData.save();
        this.addItem(item);
        this.pickupAnim(item);
    }
    addItem(item) {
        this.items.push(item);

        const el = this.createItemElement(item);

        // try to put into spell slots first
        const spellSlots = this.spellUI.getElementsByClassName('spell-slot');
        for (const slot of spellSlots) {
            if (!slot.firstChild) {
                slot.appendChild(el);
                el.classList.add('spell');
                this.actor.setWeapon(slot.id, item); // pass real Item, not just name
                return;
            }
        }

        // then try to put into inventory slots
        const invSlots = this.inventoryUI.getElementsByClassName('inventory-slot');
        for (const slot of invSlots) {
            if (!slot.firstChild) {
                slot.appendChild(el);
                return;
            }
        }

        // otherwise, create a new inventory slot
        const invSlot = this.createInventorySlot();
        invSlot.appendChild(el);
        this.itemsUI.appendChild(invSlot);
    }
    removeItem(dragged) {
        const originalParent = dragged.parentElement;
        dragged.classList.remove("dragging");
        if (!dragged.foundDrop) {
            this.actor.dropItem(dragged._item);
            LocalData.removeItem(dragged._item);

            if (originalParent.classList.contains("spell-slot")) {
                originalParent.innerHTML = "";
                this.actor.setWeapon(originalParent.id, null);
            } else {
                originalParent.innerHTML = "";
            }
        }
    }
    createItemElement(item) {
        const el = document.createElement('div');
        el.className = 'item';
        el.draggable = true;

        // store reference to the actual Item object
        el._item = item;

        const label = document.createElement('div');
        label.className = 'item-label';
        label.innerText = item.name;

        const icon = document.createElement('div');
        icon.className = 'item-icon';
        icon.style.backgroundImage = `url(${item.imgUrl})`;

        el.appendChild(icon);
        el.appendChild(label);

        return el;
    }
    pickupAnim(item) {
        const el = document.createElement('div');
        el.className = 'item-glowbox';

        const icon = document.createElement('div');
        icon.className = 'item-icon';
        icon.style.backgroundImage = `url(${item.imgUrl})`;

        el.appendChild(icon);

        document.body.appendChild(el);
        setTimeout(() => {
            el.remove();
        }, 2000);
    }
    createInventoryUI() {
        this.inventoryUI = document.createElement('div');
        this.inventoryUI.id = 'inventory-ui';
        document.body.appendChild(this.inventoryUI);

        this.itemsUI = document.createElement('div');
        this.itemsUI.id = 'inventory-items';
        this.inventoryUI.appendChild(this.itemsUI);
        this.setupDragAndDrop(this.itemsUI);

        this.spellUI = document.createElement('div');
        this.spellUI.id = 'spell-ui';
        document.body.appendChild(this.spellUI);
        this.setupDragAndDrop(this.spellUI);

        this.weaponsUI = document.createElement('div')
        this.weaponsUI.id = 'weapons-ui';
        this.inventoryUI.appendChild(this.weaponsUI);
        this.setupDragAndDrop(this.weaponsUI);

        this.createEquipSlots(this.spellUI, 2, 5)
        this.createEquipSlots(this.weaponsUI, 0, 1);

    }
    createEquipSlots(ui, from, to) {
        for (let i = from; i <= to; i++) {
            const container = document.createElement('div');
            container.className = 'spell-slot-container';

            const slot = document.createElement('div');
            slot.className = 'spell-slot';
            slot.id = String(i);
            container.appendChild(slot);

            const cd = document.createElement('div');
            cd.className = 'spell-cd';
            container.appendChild(cd);

            ui.appendChild(container);

            // store reference to each CD overlay for later
            this[`spellSlot${i}CD`] = cd;
        }
    }
    setupDragAndDrop(container) {
        // container.addEventListener("dragstart", (e) => {
        //     const spell = e.target.closest(".item");
        //     if (!spell) return;
        //     e.dataTransfer.setData("application/json", JSON.stringify({
        //         name: spell.dataset.item,
        //         img: spell.dataset.img
        //     }));
        //     e.dataTransfer.effectAllowed = "move";
        //     e.target.classList.add("dragging");
        // });
        container.addEventListener("dragstart", (e) => {
            MyEventEmitter.emit('itemDragStart');
            const el = e.target.closest(".item");
            if (!el) return;
            e.dataTransfer.effectAllowed = "move";

            // store reference globally
            e.dataTransfer.setData("text/plain", "");
            el.classList.add("dragging");

            el.foundDrop = false;
        });


        container.addEventListener("dragend", (e) => {
            const dragged = e.target;
            this.removeItem(dragged);
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

            const slot = e.target.closest(".spell-slot") || e.target.closest(".inventory-slot");
            const isInventoryContainer = e.target.closest("#inventory-items");

            const dragged = document.querySelector(`.item.dragging`);
            if (!dragged) return;
            const data = dragged._item;
            const originalParent = dragged.parentElement;

            if (slot || isInventoryContainer) {
                dragged.foundDrop = true;
            }

            if (originalParent.classList.contains("spell-slot")) {
                originalParent.innerHTML = "";
                this.actor.setWeapon(originalParent.id, null);
                console.log(originalParent.id);
            }

            // If dropped on a specific slot
            if (slot) {
                slot.classList.remove("drag-over");
                const slotFull = slot.firstChild;

                if (slotFull) {
                    const slotFullData = slotFull._item ?? null;
                    if (originalParent === slot) return; // same slot, do nothing
                    if (originalParent.classList.contains("spell-slot")) {
                        slotFull.classList.add("spell");
                        originalParent.appendChild(slotFull);
                        this.actor.setWeapon(originalParent.id, slotFullData);
                    } else if (originalParent.classList.contains("inventory-slot")) {
                        slotFull.classList.remove("spell");
                        originalParent.appendChild(slotFull);
                    }
                }

                if (slot.classList.contains("spell-slot")) {
                    dragged.classList.remove("dragging");
                    dragged.classList.add("spell");
                    slot.appendChild(dragged);
                    this.actor.setWeapon(slot.id, data);
                } else if (slot.classList.contains("inventory-slot")) {
                    dragged.classList.remove("spell");
                    slot.appendChild(dragged);
                }
                return;
            }

            // If dropped onto empty inventory area
            if (isInventoryContainer) {
                dragged.classList.remove("spell");
                const newSlot = this.createInventorySlot();
                newSlot.appendChild(dragged);
                this.itemsUI.appendChild(newSlot);
                return;
            }
        });
    }
    addCards(amount) {
        let i = 0;
        const cardLoop = setInterval(() => {
            this.aquireItem(makeRandomItem());
            i++;
            if (i >= amount) clearInterval(cardLoop);
        }, 500)
    }
}
