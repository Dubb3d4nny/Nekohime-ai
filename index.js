import makeWASocket, {
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason
} from "@adiwajshing/baileys";

import { Boom } from "@hapi/boom";
import config from './config.js'; // 👈 This uses your config.js
import fs from "fs";
import P from "pino";

const startSock = async () => {
  const { state, saveCreds } = await useMultiFileAuthState("auth");
  const { version, isLatest } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    logger: P({ level: "silent" }),
    printQRInTerminal: true,
    auth: state,
  });

  console.log(`🤖 ${config.BOT_NAME} is online!`);

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const m = messages[0];
    if (!m.message || m.key.fromMe) return;

    const from = m.key.remoteJid;
    const msg = m.message.conversation || m.message.extendedTextMessage?.text;

    // Greeting logic from config.js
    if (msg in config.COMMAND_GREETINGS) {
      const reply = config.COMMAND_GREETINGS[msg];
      await sock.sendMessage(from, { text: reply }, { quoted: m });
    }

    // Example command: ping
    if (msg === "!ping") {
      await sock.sendMessage(from, { text: "Pong!" }, { quoted: m });
    }
  });

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "close") {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log("Connection closed. Reconnecting:", shouldReconnect);
      if (shouldReconnect) startSock();
    } else if (connection === "open") {
      console.log("Connected successfully.");
    }
  });

  sock.ev.on("creds.update", saveCreds);
};

startSock();