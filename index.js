const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@adiwajshing/baileys');
const { Boom } = require('@hapi/boom');
const fs = require('fs');

// ================== CONFIG ==================
const BOT_NAME = "Nekohime"
const WELCOME_LINK_WHATSAPP = "https://whatsapp.com/channel/XXXXXXXX"  // <- replace
const WELCOME_LINK_TELEGRAM = "https://t.me/XXXXXXXX"                  // <- replace
// ============================================

// Build welcome message template
function buildWelcome({ tag, group }) {
  return (
`${tag} Welcome to ${group}! The land of The Rising Sun🇯🇵
Kindly introduce yourself🌹, drop your 3 favourite anime and a picture of you🌹
Don't forget to read the rules but remember to have fun✨

*Gain points to win free Anime merch by joining our Group Activities:*

* *HOW WELL DO YOU KNOW YOUR ANIME,* EVERY SUNDAY, 8:30pm.
* *GUESS THE ANIME BY THE IMAGE & EMOJI,* EVERY MONDAY.
* *DO YOU KNOW THE ANIME LANGUAGE (JAPANESE) & GUESS THAT ANIME,* EVERY WEDNESDAY.
* *ANIME VOICE IMPRESSION,* EVERY FRIDAY EVENING.
* *GUESS THE ANIME CHARACTER BY ITS SHADOW,* EVERY SATURDAY.

❌Rules are simple!❌
1 Be respectful—no harassment, slurs, or hate speech. ❌
2 No hentai or explicit content. ❌
3 Keep it PG—no sexual innuendos. ❌
4 Avoid profanity/spam (F* word, tf, wtf, etc.). ❌
5 No promotion without Admin approval. ❌
6 No spoilers (use spoiler tags or ask first). ❌
7 Don’t DM members without consent. ❌
Please note: breaking rules may lead to temporary mute ("Impel Down"🔒) or removal depending on severity.

Join our channels for more anime/manga/manhwa/manhua recs & updates:
${WELCOME_LINK_WHATSAPP}
${WELCOME_LINK_TELEGRAM}

Arigato🙏 アニメの世界`
  )
}

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth');

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true, // shows QR code directly
  });

  // ================== CONNECTION HANDLER ==================
  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === 'close') {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;

      console.log('❌ Connection closed. Reconnecting:', shouldReconnect);

      if (shouldReconnect) {
        startBot(); // try again
      } else {
        console.log('🔒 You are logged out. Delete the auth folder and try again.');
      }
    } else if (connection === 'open') {
      console.log(`✅ ${BOT_NAME} is connected to WhatsApp!`);
    }
  });

  // Save creds on change
  sock.ev.on('creds.update', saveCreds);

  // ================== MESSAGE HANDLER (example) ==================
  sock.ev.on('messages.upsert', async (m) => {
    try {
      const msg = m.messages[0];
      if (!msg.message) return;

      const jid = msg.key.remoteJid;
      const text =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        "";

      if (text.toLowerCase() === "!ping") {
        await sock.sendMessage(jid, { text: "Pong 🏓" }, { quoted: msg });
      }
    } catch (err) {
      console.error("Message handler error:", err);
    }
  });

  // ================== WELCOME HANDLER ==================
  sock.ev.on("group-participants.update", async (ev) => {
    try {
      if (ev.action !== "add") return;

      const groupJid = ev.id;
      const groupMeta = await sock.groupMetadata(groupJid).catch(() => null);
      const groupName = groupMeta?.subject || "YentownWeebs";

      for (const jid of ev.participants || []) {
        const number = jid.split("@")[0];
        const tagText = `@${number}`;
        const text = buildWelcome({ tag: tagText, group: groupName });

        await sock.sendMessage(groupJid, {
          text,
          mentions: [jid], // actually tags the new member
        });
      }
    } catch (err) {
      console.error("Welcome handler error:", err);
    }
  });
}

startBot();
