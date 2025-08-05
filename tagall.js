// tagall.js

const tagAllMembers = async (sock, message, groupMetadata) => {
  const participants = groupMetadata.participants;
  const mentions = participants.map((p) => p.id);
  const tagMessage = participants
    .map((p, i) => `${i + 1}. @${p.id.split('@')[0]}`)
    .join('\n');

  await sock.sendMessage(message.key.remoteJid, {
    text: `📢 *Group Mention by NekoHime:*\n\n${tagMessage}`,
    mentions
  });
};

export default tagAllMembers;