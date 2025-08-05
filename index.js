import { makeWASocket, useMultiFileAuthState } from '@adiwajshing/baileys';
import dotenv from 'dotenv';
import getAnimeInfo from './anime.js';
import tagAllMembers from './tagall.js';

dotenv.config();

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

    const body = textMsg.trim().toLowerCase();

    // Greet on hello or hi
    if (["hi", "hello", "yo", "hey"].includes(body)) {
      await sock.sendMessage(jid, { text: `👋 Konbanwa~ I'm NekoHime! Type *!anime <title>* or *!tagall* anytime!` }, { quoted: msg });
      return;
    }

    // !anime <title>
    if (body.startsWith('!anime ')) {
      const title = body.slice(7).trim();
      if (!title) {
        await sock.sendMessage(jid, { text: "❌ Please provide an anime title, senpai!" }, { quoted: msg });
        return;
      }

      const reply = await getAnimeInfo(title);
      await sock.sendMessage(jid, { text: reply }, { quoted: msg });
      return;
    }

    // !watch <title> (same function as !anime)
    if (body.startsWith('!watch ')) {
      const title = body.slice(7).trim();
      if (!title) {
        await sock.sendMessage(jid, { text: "❌ Please provide an anime title to watch!" }, { quoted: msg });
        return;
      }

      const reply = await getAnimeInfo(title);
      await sock.sendMessage(jid, { text: reply }, { quoted: msg });
      return;
    }

    // !tagall
    if (body === '!tagall') {
      const groupMetadata = await sock.groupMetadata(jid);
      await tagAllMembers(sock, msg, groupMetadata);
      return;
    }
  });
}

start();
