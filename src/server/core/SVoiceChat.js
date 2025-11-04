export default class SVoiceChat {
    constructor(io) {
        this.io = io;
    }
    bindSockets(socket) {
        socket.on("join-voice", () => {
            socket.broadcast.emit("new-peer", socket.id);
        });
        socket.on("offer", ({ targetId, offer }) => {
            this.io.to(targetId).emit("offer", { from: socket.id, offer });
        });
        socket.on("answer", ({ targetId, answer }) => {
            this.io.to(targetId).emit("answer", { from: socket.id, answer });
        });
        socket.on("candidate", ({ targetId, candidate }) => {
            this.io.to(targetId).emit("candidate", { from: socket.id, candidate });
        });
    }
}