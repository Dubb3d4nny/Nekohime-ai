import fetch from 'node-fetch';

/**
 * Fetches anime info from Jikan API and sends a formatted WhatsApp message.
 * Handles both `!anime` and `!watch` commands.
 * 
 * Usage:
 * - !anime <title>  → Detailed info with poster
 * - !watch <title>  → Just links to watch/download
 */
export async function animeCommand(sock, msg, args, command) {
  const query = args.join(" ");
  if (!query) {
    await sock.sendMessage(msg.key.remoteJid, {
      text: `⛩️ *Nekohime-chan needs a title!* Try something like:\n\`!anime One Piece\` or \`!watch Jujutsu Kaisen\``,
      quoted: msg
    });
    return;
  }

  try {
    const res = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=1`);
    const { data } = await res.json();

    if (!data || data.length === 0) {
      await sock.sendMessage(msg.key.remoteJid, {
        text: `❌ *Ara ara... I couldn't find that anime, senpai.*`,
        quoted: msg
      });
      return;
    }

    const anime = data[0];

    const title = anime.title;
    const year = anime.year ?? "Unknown";
    const genres = anime.genres.map(g => g.name).join(', ') || "Unknown";
    const score = anime.score ?? "N/A";
    const synopsis = anime.synopsis
      ? anime.synopsis.length > 400
        ? anime.synopsis.substring(0, 400) + "..."
        : anime.synopsis
      : "No synopsis available.";

    const malUrl = anime.url;
    const paheSearch = `https://www.google.com/search?q=site:animepahe.com+${encodeURIComponent(title)}`;
    const crunchySearch = `https://www.crunchyroll.com/search?from=&q=${encodeURIComponent(title)}`;

    if (command === "watch") {
      // For !watch command, send only links
      const text = `🔎 *Looking for ${title}?*\n\n` +
                   `🔗 [MyAnimeList](${malUrl})\n` +
                   `🍥 [AnimePahe](${paheSearch})\n` +
                   `🧡 [Crunchyroll](${crunchySearch})`;
      await sock.sendMessage(msg.key.remoteJid, { text, quoted: msg });
    } else {
      // For !anime command, send full info + poster
      const caption = `🌸 *Nekohime found something, nya!*\n\n` +
                      `📺 *${title}* (${year})\n` +
                      `🎭 *Genres:* ${genres}\n` +
                      `📊 *Score:* ${score}\n\n` +
                      `📝 *Synopsis:*\n${synopsis}\n\n` +
                      `🔗 [MyAnimeList](${malUrl})\n` +
                      `🍥 [AnimePahe](${paheSearch})\n` +
                      `🧡 [Crunchyroll](${crunchySearch})`;

      await sock.sendMessage(msg.key.remoteJid, {
        image: { url: anime.images.jpg.large_image_url },
        caption,
        quoted: msg
      });
    }
  } catch (err) {
    console.error("❌ Anime fetch error:", err);
    await sock.sendMessage(msg.key.remoteJid, {
      text: `⚠️ *Uwaaa~ Nekohime couldn't look that up... Something went wrong!*`,
      quoted: msg
    });
  }
}
