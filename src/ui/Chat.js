import LocalData from "../core/LocalData";
import { socket } from "../core/NetManager";
import Globals from "../utils/Globals";
import { sendDiscordMessage } from "./DiscordStuff";
import './StyleChat.css';

const section = document.createElement('div');
section.id = 'chat-section';
const messages = document.createElement('div');
messages.id = 'chatMessages';
const textInput = document.createElement('input');
textInput.id = 'chatInput';
textInput.type = 'text';
textInput.placeholder = 'Type your message here...';
textInput.autocomplete = 'off';

section.appendChild(textInput);
section.appendChild(messages);
document.body.appendChild(section);

let isChatting = false;
let message = "";
let scene;

export function chatNetwork() {
    const netMessages = (d) => {
        addMessage(d.message)
    }

    socket.on('chatMessageUpdate', ({ id, data }) => {
        netMessages(data);
    });
}

export function getChatting() {
    return isChatting;
}

export function setChatScene(s) {
    scene = s;
}

export default function setupChat() {
    let fadeTimer;
    textInput.addEventListener('focus', () => {
        Globals.input.inputBlocked = true;
        isChatting = true;
        clearTimeout(fadeTimer);
        messages.classList.add('active');
        messages.scrollTop = messages.scrollHeight;
    });

    textInput.addEventListener('blur', () => {
        Globals.input.inputBlocked = false;
        isChatting = false;
        fadeTimer = setTimeout(() => {
            messages.classList.remove('active');
            messages.scrollTop = messages.scrollHeight;
        }, 2000);
    });

    document.addEventListener('mousedown', (e) => {
        if (!section.contains(e.target)) textInput.blur();
    })
    textInput.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        textInput.focus();
    })
    textInput.addEventListener('mouseup', (e) => {
        e.stopPropagation();
    })

    window.addEventListener('keydown', (e) => {
        if (isChatting) {
            console.log(e.code);
            if (e.code === 'Escape') {
                e.preventDefault();
                textInput.blur();
            }
        }

        if (e.code === 'Enter') {
            e.preventDefault(); // prevents default behavior like newline
            if (!isChatting) {
                textInput.focus();
            } else {
                message = textInput.value; // use .value for input/textarea
                if (/^\s*$/.test(message)) {
                    textInput.value = ""; // clear after sending
                    textInput.blur();
                    return;
                };
                sendDiscordMessage(message);
                message = LocalData.name + ": " + textInput.value; // use .value for input/textarea
                addMessage(message);
                socket?.emit('chatMessageRequest', { player: LocalData.name, message });
                textInput.value = ""; // clear after sending
                textInput.blur();
            }
        }
    });
}


function addMessage(tx) {
    const newMessage = document.createElement('div');
    newMessage.className = 'chatMessage';
    newMessage.textContent = tx;
    messages.appendChild(newMessage);
    messages.scrollTop = messages.scrollHeight;
}
