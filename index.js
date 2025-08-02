import config from "./config.js";

sock.ev.on("messages.upsert", async ({ messages }) => {
  const msg = messages[0];
  if (!msg.message || msg.key.fromMe) return;

  const textMsg = msg.message.conversation || msg.message.extendedTextMessage?.text;
  const sender = msg.pushName || "Someone";
  const jid = msg.key.remoteJid;

  if (!textMsg) return;

  console.log(`💬 ${sender}: ${textMsg}`);

  // ✅ Respond to bio command
  if (textMsg.startsWith("!bio") && config.ALLOW_BIO_SCAN) {
    const target = textMsg.split(" ")[1]?.toLowerCase();
    if (target && config.ADMIN_BIOS[target]) {
      await sock.sendMessage(jid, { text: config.ADMIN_BIOS[target] });
    } else {
      await sock.sendMessage(jid, { text: "❌ NekoHime couldn't find that person." });
    }
    return;
  }

  // ✅ Special reaction when admins speak
  if (config.ADMINS.some(name => sender.includes(name))) {
    await sock.sendMessage(jid, {
      text: `👑 Bow down... the great ${sender} has spoken!`
    });
    return;
  }

  // 🤖 AI response
  const response = await askHuggingFace(textMsg);
  await sock.sendMessage(jid, { text: `${config.AI_RESPONSE_PREFIX}${response}` });
});