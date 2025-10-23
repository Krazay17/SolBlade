import MyEventEmitter from "./MyEventEmitter";
import { netSocket } from "./NetManager";
import Quest from "./Quest";

export default class QuestCrown extends Quest {
    constructor(game, manager) {
        super(game, manager, {
            title: 'Hold the Crown',
            name: 'crown',
        });
    }
    onEnter() {
        this.text = '';
        this.gameOn = false;
        this.players = {};
        this.setNotification('Enter Crown Game', 'quest-blue');

        const joinCrownGame = () => {
            if (netSocket.connected && this.player.netId) {
                this.gameOn = true;
                netSocket.emit('crownGameEnter');
            } else {
                setTimeout(joinCrownGame, 500);
            }
        };
        joinCrownGame();

        // ✅ Bind and store references
        this.onScoreIncrease = (data) => this.updateQuest(data);
        this.onDropCrown = (id) => this.dropCrown(id);
        this.onPickupCrown = (id) => this.pickupCrown(id);
        this.onGameEnd = (id) => {
            this.gameOn = false;
            const player = this.game.getActorById(id)?.name ?? 'Unknown';
            if (id === this.player.netId) {
                this.completeQuest();
            }
            this.setNotification(`${player} Wins!!!`);
        };
        this.onDied = () => {
            const diePos = this.player.position;
            const finalPos = diePos.y > (this.game.world.data.killFloor + 2) ? diePos : null;
            netSocket.emit('dropCrown', finalPos);
        };
        this.onGamePlayers = (data) => {
            this.players = data;
            this.updateQuest();
            for (const [id, p] of Object.entries(this.players)) {
                if (p.hasCrown) {
                    this.pickupCrown(id);
                    break;
                }
            }
        };

        // ✅ Register events
        MyEventEmitter.on('iDied', this.onDied);
        MyEventEmitter.on('crownGamePlayers', this.onGamePlayers);
        netSocket.on('crownScoreIncrease', this.onScoreIncrease);
        netSocket.on('dropCrown', this.onDropCrown);
        netSocket.on('crownPickup', this.onPickupCrown);
        netSocket.on('crownGameEnd', this.onGameEnd);
    }

    died() {
        const diePos = this.player.position;
        const finalPos = diePos.y > (this.game.world.data.killFloor + 2) ? diePos : null;
        netSocket.emit('dropCrown', finalPos);
    }
    destroy() {
        // ✅ Unbind with same references
        super.destroy();
    }
    pickupCrown(id) {
        console.log(this);
        const player = this.game.getActorById(id);
        if (!player) return;
        player.pickupCrown();
        this.setNotification(`${player.name} picked up the crown`)
    }
    dropCrown(id) {
        console.log('dropCrown')
        const player = this.game.getActorById(id)
        if (!player) return;
        player.dropCrown();
        if (!this.gameOn) return;
        this.setNotification(`${player.name} dropped the crown`)
    }
    onExit() {
        this.gameOn = false;
        this.setNotification('Exit Crown Game', 'quest-red');
        netSocket.emit('crownGameLeave');
        this.player.dropCrown();
        MyEventEmitter.off('iDied', this.onDied);
        MyEventEmitter.off('crownGamePlayers', this.onGamePlayers);
        netSocket.off('crownScoreIncrease', this.onScoreIncrease);
        netSocket.off('dropCrown', this.onDropCrown);
        netSocket.off('crownPickup', this.onPickupCrown);
        netSocket.off('crownGameEnd', this.onGameEnd);

        super.onExit();
    }
    completeQuest() {
        this.game.inventory.addCards(10);
    }
    updateQuest(data) {
        if (data) this.players[data.id].score = data.score;
        let questText = '';
        for (const [id, p] of Object.entries(this.players)) {
            const actor = this.manager.game.actorManager.getActorById(id);
            if (!actor) break;
            questText += `\n  ${actor.name}: ${p.score}`;
        }
        this.text = questText;
    }
    update() {
        if (this.manager.game.solWorld !== 'world2') this.manager.remove(this)
    }
}