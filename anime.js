// anime.js
import fetch from 'node-fetch';

/**
 * Fetch anime info from Jikan API based on a title.
 * Returns a short text summary.
 */
export async function getAnimeInfo(title) {
  try {
    const response = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(title)}&limit=1`);
    const data = await response.json();

    if (!data.data || data.data.length === 0) {
      return "❌ Couldn't find that anime, senpai.";
    }

    const anime = data.data[0];

    return `🎬 *${anime.title}* (${anime.type})
📅 Aired: ${anime.aired.string}
💬 Episodes: ${anime.episodes}
⭐ Score: ${anime.score ?? "N/A"}

📝 Synopsis:
${anime.synopsis?.slice(0, 300) || "No synopsis available."}
🔗 More: ${anime.url}`;
  } catch (err) {
    console.error("Anime Fetch Error:", err);
    return "⚠️ Something went wrong while fetching anime info.";
  }
}
