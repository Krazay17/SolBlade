import MyEventEmitter from "./MyEventEmitter";
import { joinAckd, netSocket } from "./NetManager";
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
            if (joinAckd) {
                if (this.gameOn) return;
                this.gameOn = true;
                netSocket.emit('crownGameEnter');
            } else {
                setTimeout(joinCrownGame, 500);
            }
        };
        joinCrownGame();

        // ✅ Bind and store references
        this.onConnect = () => joinCrownGame();
        this.onDisconnect = () => this.leaveCrownGame();
        this.onScoreIncrease = (data) => this.updateQuest(data);
        this.onDropCrown = (id) => this.dropCrown(id);
        this.onPickupCrown = (id) => this.pickupCrown(id);
        this.onGameEnd = (id) => {
            const player = this.game.getActorById(id)?.name ?? 'Unknown';
            if (id === this.player.id) {
                this.completeQuest();
            }
            this.setNotification(`${player} Wins!!!`);
        };
        this.onDied = () => {
            const diePos = this.player.position;
            const finalPos = diePos.y > (this.game.scene.data.killFloor + 2) ? diePos : null;
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
        MyEventEmitter.on('joinAck', this.onConnect);
        MyEventEmitter.on('disconnect', this.onDisconnect);
        netSocket.on('crownScoreIncrease', this.onScoreIncrease);
        netSocket.on('dropCrown', this.onDropCrown);
        netSocket.on('crownPickup', this.onPickupCrown);
        netSocket.on('crownGameEnd', this.onGameEnd);
    }
    leaveCrownGame() {
        this.game.player.dropCrown();
        this.gameOn = false;
    }
    died() {
        const diePos = this.player.position;
        const finalPos = diePos.y > (this.game.world.data.killFloor + 2) ? diePos : undefined;
        netSocket.emit('dropCrown', finalPos);
    }
    destroy() {
        super.destroy();
    }
    pickupCrown(id) {
        const player = this.game.getActorById(id);
        if (!player) return;
        player.pickupCrown();
        this.setNotification(`${player.name} picked up the crown`)
    }
    dropCrown(id) {
        const player = this.game.getActorById(id)
        if (!player) return;
        player.dropCrown();
        if (!this.gameOn) return;
        this.setNotification(`${player.name} dropped the crown`)
    }
    onExit() {
        this.setNotification('Exit Crown Game', 'quest-red');
        netSocket.emit('crownGameLeave');
        this.player.dropCrown();

        MyEventEmitter.off('iDied', this.onDied);
        MyEventEmitter.off('crownGamePlayers', this.onGamePlayers);
        MyEventEmitter.off('joinAck', this.onConnect);
        MyEventEmitter.off('disconnect', this.onDisconnect);
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
        if (data) {
            const { id, score } = data
            const player = this.players[id];
            if (player) player.score = score;
        }
        let questText = '';
        for (const [id, p] of Object.entries(this.players)) {
            const actor = this.manager.game.actorManager.getActorById(id);
            if (!actor) break;
            questText += `\n  ${actor.name}: ${p.score}`;
        }
        this.text = questText;
    }
}