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
        await sock.sendMessage(jid


// Handle !tagall
        if (body === '!tagall' && isGroup) {
            const groupMetadata = await sock.groupMetadata(from);
            const isAdmin = groupMetadata.participants.find(p => p.id === sender && p.admin);
            if (!isAdmin) {
                return sock.sendMessage(from, { text: '⚠️ Only admins can use this command.' }, { quoted: message });
            }
            return await tagAllMembers(sock, message, groupMetadata);
        }

        // Handle !anime
        if (body.startsWith('!anime')) {
            const query = body.split(' ').slice(1).join(' ');
            const reply = await fetchAnime(query || 'One Piece');
            return sock.sendMessage(from, { text: reply }, { quoted: message });
        }

        // AI personality mode (e.g., regular conversation)
        if (!body.startsWith('!')) {
            const mood = personality.mood;
            const reply = `${mood.prefix} ${body}? That's interesting!`;
            return sock.sendMessage(from, { text: reply }, { quoted: message });
        }
    });
}

startNekoHime();