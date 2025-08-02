import { makeWASocket, useMultiFileAuthState } from '@adiwajshing/baileys';
import { getAnimeInfo } from './anime.js';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;

async function askHuggingFace(prompt) {
  try {
    const response = await fetch("https://api-inference.huggingface.co/models/bigscience/bloom", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${HF_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputs: prompt }),
    });

    const result = await response.json();
    return result[0]?.generated_text || "I couldn't come up with a reply.";
  } catch (err) {
    console.error("Hugging Face error:", err);
    return "⚠️ Hugging Face API error.";
  }
}

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState('session');
  const sock = makeWASocket({ auth: state });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message) return;

    const jid = msg.key.remoteJid;
    const textMsg = msg.message.conversation || msg.message.extendedTextMessage?.text;

    if (!textMsg) return;

    // 🎌 Anime command
    if (textMsg.toLowerCase().startsWith("!anime ")) {
      const title = textMsg.slice(7).trim();
      if (!title) {
        await sock.sendMessage(jid, { text: "❗ Please provide an anime title. Try: `!anime bleach`" });
        return;
      }

      await sock.sendPresenceUpdate('composing', jid);
      await new Promise(res => setTimeout(res, 1000));
      const info = await getAnimeInfo(title);
      await sock.sendMessage(jid, { text: info });
      return;
    }

    // 💬 General AI replies
    await sock.sendPresenceUpdate('composing', jid);
    const reply = await askHuggingFace(textMsg);
    await sock.sendMessage(jid, { text: reply });
  });

  console.log("🚀 NekoHime is running...");
}

start().catch(err => console.error("❌ Failed to start NekoHime:", err));