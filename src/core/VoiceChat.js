import { menuButton } from "../ui/Menu";
import MyEventEmitter from "./MyEventEmitter";
import { netSocket } from "./NetManager";
import soundPlayer from "./SoundPlayer";

const config = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

class VoiceChat {
    constructor() {
        this.localStream = null;
        this.peers = {}; // peerId -> RTCPeerConnection
        this.voiceActive = false;
        this.gainNode = null;
        this.compressNode = null;
        this.scene = null;
        this.audioContext = null;
        this.voicesVolume = 1;

        // Listen for new peers
        netSocket.on("new-peer", async peerId => {
            //if (!this.voiceActive) return;
            await this.connectToPeer(peerId, true); // we are initiator
        });

        // Handle offer
        netSocket.on("offer", async ({ from, offer }) => {
            //if (!this.voiceActive) return;
            await this.connectToPeer(from, false, offer);
        });

        // Handle answer
        netSocket.on("answer", async ({ from, answer }) => {
            const pc = this.peers[from];
            if (pc) await pc.setRemoteDescription(answer);
        });

        // Handle ICE
        netSocket.on("candidate", async ({ from, candidate }) => {
            const pc = this.peers[from];
            if (pc) {
                try { await pc.addIceCandidate(candidate); }
                catch (err) { console.error("ICE error", err); }
            }
        });

        // Peer disconnect
        netSocket.on("peer-disconnect", peerId => {
            if (this.peers[peerId]) {
                this.peers[peerId].close();
                delete this.peers[peerId];
            }
        });

        MyEventEmitter.on('micVolumeChanged', (value) => {
            if (this.gainNode) {
                this.gainNode.gain.value = value;
            }
        })

        MyEventEmitter.on('voicesVolumeChanged', (value) => {
            this.voicesVolume = value;
        });
    }

    setScene(scene) {
        this.scene = scene;
    }

    createButton() {
        const button = menuButton('Toggle Voice', async () => {
            if (!this.voiceActive) {
                this.voiceActive = true;
                button.classList.add('active');
                await this.initMic();
                netSocket.emit("join-voice"); // Notify others to connect
            } else {
                this.voiceActive = false;
                button.classList.remove('active');
                Object.values(this.peers).forEach(pc => {
                    pc.close();
                });
                this.peers = {};
                this.localStream.getTracks().forEach(track => track.stop());
                this.localStream = null;
            }
        });
    }
    async initMic() {
        if (!this.localStream) {
            const originalStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: false   // we’re doing our own
                }
            });

            this.audioContext = new AudioContext();

            // Source from mic
            const source = this.audioContext.createMediaStreamSource(originalStream);

            // High-pass filter (remove low rumbles)
            const highPass = this.audioContext.createBiquadFilter();
            highPass.type = "highpass";
            highPass.frequency.setValueAtTime(150, this.audioContext.currentTime);

            // // Compressor (tame spikes)
            // this.compressNode = this.audioContext.createDynamicsCompressor();
            // this.compressNode.threshold.setValueAtTime(-35, this.audioContext.currentTime);
            // this.compressNode.knee.setValueAtTime(20, this.audioContext.currentTime);
            // this.compressNode.ratio.setValueAtTime(6, this.audioContext.currentTime);
            // this.compressNode.attack.setValueAtTime(0.02, this.audioContext.currentTime);
            // this.compressNode.release.setValueAtTime(0.05, this.audioContext.currentTime);

            // // Make a constant low-level signal
            // const noiseFloor = this.audioContext.createConstantSource();
            // noiseFloor.offset.value = 0.0003; // very tiny DC offset

            // // Gain to make sure it's inaudible but present
            // const noiseGain = this.audioContext.createGain();
            // noiseGain.gain.value = 0.2;

            // // Route it into the compressor along with mic
            // noiseFloor.connect(noiseGain).connect(this.compressNode);
            // noiseFloor.start();

            this.gainNode = this.audioContext.createGain();
            this.gainNode.gain.value = soundPlayer.micVolume * soundPlayer.masterVolume;


            // Destination stream (for WebRTC)
            const destination = this.audioContext.createMediaStreamDestination();

            // Connect chain: mic → highpass → compressor → gain → destination
            source.connect(highPass)
                .connect(this.gainNode)
                .connect(destination);

            this.localStream = destination.stream;

        }
    }

    async connectToPeer(peerId, initiator, remoteOffer = null) {
        const pc = new RTCPeerConnection(config);
        this.peers[peerId] = pc;

        // Add our mic to this connection
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => pc.addTrack(track, this.localStream));
        } else {
            // Add a silent track so connection can establish
            pc.addTrack(createSilentTrack(), new MediaStream());
        }

        // Remote audio
        const audio = document.createElement("audio");
        audio.autoplay = true;
        document.body.appendChild(audio);

        pc.ontrack = e => {
            audio.srcObject = e.streams[0];
            audio.volume = this.voicesVolume;
        };

        // ICE
        pc.onicecandidate = e => {
            if (e.candidate) {
                netSocket.emit("candidate", { targetId: peerId, candidate: e.candidate });
            }
        };

        if (initiator) {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            netSocket.emit("offer", { targetId: peerId, offer });
        } else {
            await pc.setRemoteDescription(remoteOffer);
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            netSocket.emit("answer", { targetId: peerId, answer });
        }
    }
}
function createSilentTrack() {
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    oscillator.frequency.setValueAtTime(0, ctx.currentTime); // inaudible
    const dst = oscillator.connect(ctx.createMediaStreamDestination());
    oscillator.start();
    const track = dst.stream.getAudioTracks()[0];
    return track;
}


const voiceChat = new VoiceChat();
export default voiceChat;