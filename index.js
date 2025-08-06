import pkg from '@adiwajshing/baileys';
const { makeWASocket, useMultiFileAuthState, DisconnectReason } = pkg;

import { Boom } from '@hapi/boom';
import fs from 'fs';
import path from 'path';

import animeCommand from './commands/anime.js';
import tagAllMembers from './commands/tagall.js';
import config from './config.js';

const startSock = async () => {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        defaultQueryTimeoutMs: undefined,
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error = Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Connection closed due to', lastDisconnect.error, ', reconnecting:', shouldReconnect);
            if (shouldReconnect) startSock();
        } else if (connection === 'open') {
            console.log('✅ Bot connected!');
        }
    });

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;

        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const messageContent = msg.message.conversation || msg.message.extendedTextMessage?.text;
        const sender = msg.key.remoteJid;

        // Anime command
        if (messageContent?.startsWith('!anime')) {
            await animeCommand(sock, msg, messageContent);
        }

        // Tagall command
        if (messageContent === '!tagall') {
            const metadata = await sock.groupMetadata(sender);
            await tagAllMembers(sock, msg, metadata);
        }

        // Custom mood controls
        if (messageContent === '!nekoneutral') {
            config.autoMood = false;
            config.currentMood = 'neutral';
            await sock.sendMessage(sender, { text: `😐 Nekohime is now in neutral mode.` });
        }

        if (messageContent === '!autoneko') {
            config.autoMood = true;
            await sock.sendMessage(sender, { text: `🎭 Nekohime is now set to auto mood.` });
        }

        // Greeting new participants
        if (msg.messageStubType === 27) {
            const metadata = await sock.groupMetadata(sender);
            const participant = msg.messageStubParameters[0];
            await sock.sendMessage(sender, {
                text: `👋 Welcome @${participant.split('@')[0]} to *${metadata.subject}*!`,
                mentions: [participant],
            });
        }
    });
};

startSock();