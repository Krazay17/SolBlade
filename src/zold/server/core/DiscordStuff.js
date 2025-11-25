import 'dotenv/config';

export async function sendDiscordMessage(message) {
    const webhookURL = process.env.DISCORD_WEBHOOK;

    const messageToSend = message;
    const playerName = "Server";
    const payload = {
        content: messageToSend, // plain text
        username: playerName,          // optional, overrides webhook name
        avatar_url: "https://conduit.bar/assets/CardScythe.png"
    };

    await fetch(webhookURL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    })
}