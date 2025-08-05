import { makeWASocket, useMultiFileAuthState } from '@adiwajshing/baileys';
import { getAnimeInfo } from './anime.js';
import config from './config.js';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const HF_API_KEY = config.HUGGINGFACE_API_KEY;
const ADMIN_JIDS = config.ADMINS;
let userStrikes = {};
let adminNotes = []; // dynamic learning storage

const bannedWords = ["fuck", "shit", "bitch", "nigga", "faggot"]; // customize this
const linkRegex = /(https?:\/\/|www\.)\S+/i;

// 🧠 AI Chat Function
async function askHuggingFace(prompt) {
  try {
    const response = await fetch("https://api-inference.huggingface.co/models/bigscience/bloom", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_API_KEY}`,
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

// 🚨 STRIKE HANDLER
async function handleStrike(sock, jid, userJid, reason, msg) {
  userStrikes[userJid] = (userStrikes[userJid] || 0) + 1;
  const count = userStrikes[userJid];

  await sock.sendMessage(jid, {
    text: `⚠️ Warning to @${userJid.split('@')[0]} for: ${reason}\nStrike ${count}/3`,
    mentions: [userJid],
  });

  if (count >= 3) {
    await sock.sendMessage(jid, {
      text: `🚫 @${userJid.split('@')[0]} has been removed after 3 strikes.`,
      mentions: [userJid],
    });
    await sock.groupParticipantsUpdate(jid, [userJid], "remove");
    delete userStrikes[userJid];
  }
}

// 🔥 BOT START
async function start() {
  const { state, saveCreds } = await useMultiFileAuthState('session');
  const sock = makeWASocket({ auth: state });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const jid = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;
    const textMsg = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
    const body = textMsg.trim().toLowerCase();

    // ✅ Handle Anime Command
    if (body.startsWith("!anime ")) {
      const title = body.slice(7).trim();
      if (!title) return await sock.sendMessage(jid, { text: "❌ Please provide an anime title!" }, { quoted: msg });
      const reply = await getAnimeInfo(title);
      await sock.sendMessage(jid, { text: reply }, { quoted: msg });
      return;
    }

    // ✅ Handle Watch
    if (body.startsWith("!watch ")) {
      const title = body.slice(7).trim();
      const reply = await getAnimeInfo(title);
      await sock.sendMessage(jid, { text: reply }, { quoted: msg });
      return;
    }

    // ✅ Admin-only note-taking
    if (body.startsWith("!note ")) {
      if (ADMIN_JIDS.includes(sender)) {
        const note = body.slice(6).trim();
        adminNotes.push(note);
        await sock.sendMessage(jid, { text: `📝 Noted: "${note}"` });
      } else {
        await sock.sendMessage(jid, { text: `🚫 You’re not authorized to set rules.` });
      }
      return;
    }

    if (body === "!notes") {
      const notes = adminNotes.length ? adminNotes.map((n, i) => `${i + 1}. ${n}`).join("\n") : "No notes yet.";
      await sock.sendMessage(jid, { text: `📚 Current Notes:\n${notes}` });
      return;
    }

    // 🚨 Link Detection
    if (linkRegex.test(textMsg)) {
      await handleStrike(sock, jid, sender, "Sending unauthorized link", msg);
      return;
    }

    // 🚨 Swear Detection
    if (bannedWords.some(word => textMsg.includes(word))) {
      await handleStrike(sock, jid, sender, "Using inappropriate language", msg);
      return;
    }

    // 🤖 AI Chat Fallback (with mood)
    if (!body.startsWith("!")) {
      let mood = config.DEFAULT_MOOD;
      for (let [moodType, triggers] of Object.entries(config.MOOD_SWITCH_TRIGGERS)) {
        if (triggers.some(t => body.includes(t))) mood = moodType;
      }
      const moodData = config.MOODS[mood];
      const ai = await askHuggingFace(textMsg);
      await sock.sendMessage(jid, {
        text: `${moodData.prefix}${moodData.style}\n\n🧠 ${ai}`,
      }, { quoted: msg });
    }
  });
}

start();
