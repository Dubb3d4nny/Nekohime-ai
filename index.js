// index.js

import { default as makeWASocket, useMultiFileAuthState, DisconnectReason } from '@adiwajshing/baileys';
import pino from 'pino';
import { Boom } from '@hapi/boom';
import tagAllMembers from './commands/tagall.js';
import fs from 'fs';

const startSock = async () => {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: true,
        auth: state
    });

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const messageType = Object.keys(msg.message)[0];
        const body = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
        const sender = msg.key.remoteJid;

        // Handle !tagall command in group
        if (body.toLowerCase().startsWith('!tagall') && msg.key.participant) {
            const groupMetadata = await sock.groupMetadata(sender);
            await tagAllMembers(sock, msg, groupMetadata);
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Connection closed. Reconnecting...', shouldReconnect);
            if (shouldReconnect) startSock();
        } else if (connection === 'open') {
            console.log('✅ Nekohime is online.');
        }
    });
};

startSock();