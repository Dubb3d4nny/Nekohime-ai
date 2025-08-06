import baileys from '@adiwajshing/baileys';
import Pino from 'pino';
import { Boom } from '@hapi/boom';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import * as fs from 'fs';
import * as path from 'path';

// Baileys Setup
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} = baileys;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const startSock = async () => {
  const { state, saveCreds } = await useMultiFileAuthState(path.join(__dirname, 'auth_info'));

  const { version, isLatest } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: true,
    logger: Pino({ level: 'silent' }),
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect.error = Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('Connection closed due to', lastDisconnect.error, ', reconnecting:', shouldReconnect);
      if (shouldReconnect) {
        startSock();
      }
    } else if (connection === 'open') {
      console.log('✅ Connected to WhatsApp!');
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const text = msg.message.conversation || msg.message.extendedTextMessage?.text;

    if (text?.toLowerCase() === 'hi' || text?.toLowerCase() === 'hello') {
      await sock.sendMessage(msg.key.remoteJid, { text: 'Hello! Nekohime is online 💬' });
    }

    if (text?.toLowerCase() === 'ping') {
      await sock.sendMessage(msg.key.remoteJid, { text: 'Pong! 🏓' });
    }

    // Add more commands here
  });
};

startSock();