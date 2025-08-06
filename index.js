const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@adiwajshing/baileys');
const { Boom } = require('@hapi/boom');
const fs = require('fs');

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth');

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true, // shows QR code directly
  });

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
      console.log('✅ Bot is connected to WhatsApp!');
    }
  });

  sock.ev.on('creds.update', saveCreds);
}

startBot();