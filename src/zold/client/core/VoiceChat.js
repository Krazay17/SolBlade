import { menuButton } from "../ui/Menu";
import LocalData from "../../../client/core/LocalData";
import MyEventEmitter from "../../../common/core/MyEventEmitter";
import { netSocket } from "./NetManager";
import * as THREE from "three";

const config = {
    iceServers: [
        { urls: "Stun:stun.l.google.com:19302" },
        { urls: "Stun:stun1.l.google.com:19302" },
        { urls: "Stun:stun2.l.google.com:19302" },
        { urls: "Stun:stun3.l.google.com:19302" },
    ]
};

export default class VoiceChat {
    constructor(netSocket) {
        this.netSocket = netSocket;
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
        this.localStream = null;
        /** @type {{ [peerId: string]: RTCPeerConnection }} */
        this.peers = {};

        this.voiceMap = {}
        this.voiceActive = false;
        this.gainNode = null;
        this.compressNode = null;
        this.scene = null;
        this.voicesVolume = 1;
        this.tempVector = new THREE.Vector3();

        this.closeDistance = 1;
        this.maxDistance = 6;
        this.fallOff = .5;

        this.init();
        this.initMic();
    }

    init() {
        if (this.voiceBound) return;
        this.voiceBound = true;

        netSocket.on("new-peer", async peerId => {
            await this.connectToPeer(peerId, true); // we are initiator
        });

        // Handle offer
        netSocket.on("offer", async ({ from, offer }) => {
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
        netSocket.on("playerDisconnected", peerId => {
            if (this.peers[peerId]) {
                this.peers[peerId].close();
                delete this.peers[peerId];
            }
        });

        MyEventEmitter.on('micVolumeChanged', (value) => {
            if (this.gainNode) {
                this.gainNode.gain.value = value * 1.5;
            }
        })

        MyEventEmitter.on('voicesVolumeChanged', (value) => {
            this.voicesVolume = value * 2;
        });

        setInterval(() => {
            if (!this.scene) return;
            const player = this.scene.player;
            if (!player) return;
            const playerPos = player.position;
            if (!playerPos.y) return;
            const time = this.audioContext.currentTime;
            const playerRot = player.yaw;
            const forward = this.tempVector.set(0, 0, -1);
            forward.applyAxisAngle(new THREE.Vector3(0, 1, 0), playerRot);
            if (this.audioContext.listener.forwardX) {
                this.audioContext.listener.forwardX.linearRampToValueAtTime(forward.x, time + 0.1);
                this.audioContext.listener.forwardY.linearRampToValueAtTime(forward.y, time + 0.1);
                this.audioContext.listener.forwardZ.linearRampToValueAtTime(forward.z, time + 0.1);
            } else {
                this.audioContext.listener.setOrientation(forward.x, forward.y, forward.z, 0, 1, 0);
            }
            if (this.audioContext.listener.positionX) {
                this.audioContext.listener.positionX.linearRampToValueAtTime(playerPos.x, time + 0.1);
                this.audioContext.listener.positionY.linearRampToValueAtTime(playerPos.y, time + 0.1);
                this.audioContext.listener.positionZ.linearRampToValueAtTime(playerPos.z, time + 0.1);
            } else {
                this.audioContext.listener.setPosition(playerPos.x, playerPos.y, playerPos.z);
            }
            /**@type {Map} */
            const players = this.scene.getScenePlayersPos();
            if (!players) return;

            players.forEach((pos, id) => {
                if (id === netSocket.id) return; // don't update our own
                if (!this.voiceMap) return;
                const audio = this.voiceMap[id];
                if (!audio) return;
                if (audio.gain) {
                    //audio.gain.gain.linearRampToValueAtTime(this.voicesVolume, time + 0.06);
                }
                /**@type {PannerNode} */
                const panner = audio.panner;
                if (panner) {
                    if (panner.positionX) {
                        panner.positionX.linearRampToValueAtTime(pos.x, time + 0.1);
                        panner.positionY.linearRampToValueAtTime(pos.y, time + 0.1);
                        panner.positionZ.linearRampToValueAtTime(pos.z, time + 0.1);
                    } else {
                        panner.setPosition(pos.x, pos.y, pos.z);
                    }
                }
            });
        }, 50);
    }
    setScene(scene) {
        this.scene = scene;
        if (!this.voiceMap) return;
        for (const [id, v] of Object.entries(this.voiceMap)) {
            //v.gain.gain.value = 0;
        }
    }

    createButton() {
        const button = menuButton('Toggle Voice', async () => {
            if (!this.voiceActive) {
                this.voiceActive = true;
                button.classList.add('active');
                if (this.audioContext.state === "suspended") {
                    this.audioContext.resume();
                }

                await this.initMic();
                this.init();
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
        this.voiceActive = true;
        button.classList.add('active');
    }
    async initMic() {
        if (!this.localStream) {
            const originalStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    noiseSuppression: true,
                    echoCancellation: true,
                    autoGainControl: true,
                    sampleRate: 48000,
                }
            });

            // Source from mic
            const source = this.audioContext.createMediaStreamSource(originalStream);

            // High-pass filter (remove low rumbles)
            const highPass = this.audioContext.createBiquadFilter();
            highPass.type = "highpass";
            highPass.frequency.setValueAtTime(150, this.audioContext.currentTime);

            const lowPass = this.audioContext.createBiquadFilter();
            lowPass.type = "lowpass";
            lowPass.frequency.setValueAtTime(7000, this.audioContext.currentTime);
            highPass.connect(lowPass);

            // Compressor (tame spikes)
            // this.compressNode = this.audioContext.createDynamicsCompressor();
            // this.compressNode.threshold.setValueAtTime(-10, this.audioContext.currentTime);
            // this.compressNode.knee.setValueAtTime(20, this.audioContext.currentTime);
            // this.compressNode.ratio.setValueAtTime(6, this.audioContext.currentTime);
            // this.compressNode.attack.setValueAtTime(0.1, this.audioContext.currentTime);
            // this.compressNode.release.setValueAtTime(0.25, this.audioContext.currentTime);

            // // Make a constant low-level signal
            // const noiseFloor = this.audioContext.createConstantSource();
            // noiseFloor.offset.value = 0.0003; // very tiny DC offset

            // // Gain to make sure it's inaudible but present
            // const noiseGain = this.audioContext.createGain();
            // noiseGain.gain.value = 0.1;

            // // Route it into the compressor along with mic
            // noiseFloor.connect(noiseGain).connect(this.compressNode);
            // noiseFloor.start();

            this.gainNode = this.audioContext.createGain();
            this.gainNode.gain.value = LocalData.micVolume;

            // Destination stream (for WebRTC)
            const destination = this.audioContext.createMediaStreamDestination();

            // Connect chain: mic → highpass → compressor → gain → destination
            source.connect(highPass)
                .connect(lowPass)
                .connect(this.gainNode)
                //.connect(this.compressNode)
                .connect(destination);

            this.localStream = destination.stream;

            netSocket.emit("join-voice"); // Notify others to connect
        }
    }

    async connectToPeer(peerId, initiator, remoteOffer = null) {
        if (this.audioContext.state === "suspended") {
            console.log("Resuming audio context for new peer");
            await this.audioContext.resume();
            console.log("Audio context resumed");
        }
        const pc = new RTCPeerConnection(config);
        this.peers[peerId] = pc;

        // Add our mic to this connection
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => pc.addTrack(track, this.localStream));
        } else {
            // Add a silent track so connection can establish
            pc.addTrack(createSilentTrack(), new MediaStream());
        }

        pc.ontrack = e => {
            const stream = e.streams[0];
            if (!stream || stream.getAudioTracks().length === 0) return;

            // --- 1) Raw playback for guaranteed audio ---
            const audioElement = document.createElement("audio");
            audioElement.autoplay = true;
            audioElement.srcObject = stream;
            audioElement.volume = 0;
            //document.body.appendChild(audioElement);
            audioElement.play().catch(() => console.log("Playback blocked until user interacts"));

            // --- 2) AudioContext for effects / spatialization ---
            if (!this.audioContext) this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            if (this.audioContext.state === "suspended") this.audioContext.resume();

            const source = this.audioContext.createMediaStreamSource(stream);

            // Gain node (per-voice volume)
            const gain = this.audioContext.createGain();
            gain.gain.value = 0;

            // Optional panner for spatial audio
            const panner = this.audioContext.createPanner();
            panner.panningModel = 'HRTF';
            panner.distanceModel = 'inverse';
            panner.refDistance = this.closeDistance;
            panner.maxDistance = this.maxDistance;
            panner.rolloffFactor = this.fallOff;
            panner.orientationX.setValueAtTime(0, this.audioContext.currentTime);
            panner.orientationY.setValueAtTime(0, this.audioContext.currentTime);
            panner.orientationZ.setValueAtTime(-1, this.audioContext.currentTime);

            // Connect graph: source -> panner -> gain -> destination
            source
                .connect(panner)
                //.connect(gain)
                .connect(this.audioContext.destination);

            // Save references if you want to update volume / position later
            if (!this.voiceMap) this.voiceMap = {};
            this.voiceMap[peerId] = { source, gain, panner, stream };
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

function debugStream(stream, audioContext) {
    const src = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 512;
    src.connect(analyser);

    const data = new Uint8Array(analyser.frequencyBinCount);

    setInterval(() => {
        analyser.getByteTimeDomainData(data);

        let sum = 0;
        for (let i = 0; i < data.length; i++) {
            const v = (data[i] - 128) / 128;
            sum += v * v;
        }
        const rms = Math.sqrt(sum / data.length);
        console.log("stream RMS:", rms.toFixed(4));
    }, 500);
}