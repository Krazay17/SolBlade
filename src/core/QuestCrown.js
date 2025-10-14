import MyEventEmitter from "./MyEventEmitter";
import { netSocket } from "./NetManager";
import Quest from "./Quest";

export default class QuestCrown extends Quest {
    onEnter() {
        this.questTitle = 'Hold the Crown';
        this.text = '';
        this.gameOn = false;
        this.players = {};
        this.setNotification('Enter Crown Game', 'quest-blue');
        const joinCrownGame = () => {
            if (netSocket.connected && this.player.netId) {
                this.gameOn = true;
                netSocket.emit('crownGameEnter');
                MyEventEmitter.on('crownGamePlayers', data => {
                    this.players = data;
                    this.updateQuest();
                    for (const [id, p] of Object.entries(this.players)) {
                        if (p.hasCrown) this.pickupCrown(id);
                    }
                })
            } else {
                let tries = 0
                setTimeout(() => {
                    if (tries < 10) {
                        joinCrownGame()
                        tries++
                    }
                }, 500)
            }
        }
        joinCrownGame();
        netSocket.on('crownScoreIncrease', data => {
            this.updateQuest(data);
        })
        MyEventEmitter.on('iDied', () => {
            const diePos = this.player.serialize().pos;
            const finalPos = this.player.position.y > this.scene.data.killFloor ? diePos : null;
            netSocket.emit('dropCrown', finalPos);
        });
        netSocket.on('dropCrown', (id) => {
            this.dropCrown(id);
        });
        netSocket.on('crownPickup', id => {
            this.pickupCrown(id);
        })
        netSocket.on('crownGameEnd', id => {
            this.gameOn = false;
            const player = this.scene.actorManager.getActorById(id).name;
            this.setNotification(`${player} Wins!!!`);
        })

    }
    destroy() {
        super.destroy();
        MyEventEmitter.off('iDied');
        netSocket.off('crownScoreIncrease')
        netSocket.off('dropCrown');
        netSocket.off('crownPickup');
        netSocket.off('crownGameEnd');
        MyEventEmitter.off('crownGamePlayers');
    }
    pickupCrown(id) {
        const player = this.scene.actorManager.getActorById(id);
        if (!player) return;
        this.gameOn = true;
        player.pickupCrown();
        this.setNotification(`${player.name} picked up the crown`)
    }
    dropCrown(id) {
        const player = this.scene.actorManager.getActorById(id)
        if (!player) return;
        player.dropCrown();
        if(!this.gameOn) return;
        this.setNotification(`${player.name} dropped the crown`)
    }
    onExit() {
        this.setNotification('Exit Crown Game', 'quest-red');
        netSocket.emit('crownGameLeave');
        this.destroy();
    }
    updateQuest(data) {
        if (data) this.players[data.id].score = data.score;
        let questText = '';
        for (const [id, p] of Object.entries(this.players)) {
            const actor = this.scene.actorManager.getActorById(id).name;
            if (!actor) break;
            questText += `\n     ${actor}: ${p.score}`;
        }
        this.text = questText;
    }
}