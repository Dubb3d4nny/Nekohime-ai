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
    if (!msg.message || msg.key.fromMe) return;

    const jid = msg.key.remoteJid;
    const textMsg = msg.message.conversation || msg.message.extendedTextMessage?.text;
    if (!textMsg) return;

    const body = textMsg.trim();

    // Handle !anime command
    if (body.toLowerCase().startsWith('!anime ')) {
      const title = body.slice(7).trim();
      if (!title) {
        await sock.sendMessage(jid, { text: "❌ Please provide an anime title, senpai!" }, { quoted: msg });
        return;
      }
      const reply = await getAnimeInfo(title);
      await sock.sendMessage(jid, { text: reply }, { quoted: msg });
      return;
    }

    // Handle !watch command (optional)
    if (body.toLowerCase().startsWith('!watch ')) {
      const title = body.slice(7).trim();
      if (!title) {
        await sock.sendMessage(jid, { text: "❌ Please provide an anime title to watch, senpai!" }, { quoted: msg });
        return;
      }
      // You can implement getWatchLinks(title) or reuse getAnimeInfo with flag
      // For now just reuse getAnimeInfo or add your own watch function
      const reply = await getAnimeInfo(title); // or a special watch function if you add it
      await sock.sendMessage(jid, { text: reply }, { quoted: msg });
      return;
    }

    // Example: AI Personality response (fallback for normal chat)
    if (!body.startsWith('!')) {
      const reply = await askHuggingFace(body);
      await sock.sendMessage(jid, { text: `🧠 NekoHime: ${reply}` }, { quoted: msg });
    }
  });
}

start();
