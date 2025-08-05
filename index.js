import { makeWASocket, useMultiFileAuthState } from '@adiwajshing/baileys';
import fetch from 'node-fetch';
import config from './config.js';
import tagAllMembers from './tagall.js';
import { getAnimeInfo } from './anime.js';

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

    // Tagall command
    if (body === '!tagall') {
      const groupMetadata = await sock.groupMetadata(jid);
      await tagAllMembers(sock, msg, groupMetadata);
      return;
    }

    // Optional greetings
    if (config.COMMAND_GREETINGS[body]) {
      await sock.sendMessage(jid, { text: config.COMMAND_GREETINGS[body] }, { quoted: msg });
      return;
    }

    // Optional anime info
    if (body.startsWith('!anime ')) {
      const title = body.slice(7).trim();
      const reply = await getAnimeInfo(title);
      await sock.sendMessage(jid, { text: reply }, { quoted: msg });
      return;
    }
  });
}

start();
