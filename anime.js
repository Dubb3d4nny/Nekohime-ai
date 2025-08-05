// anime.js

import fetch from 'node-fetch';

async function getAnimeInfo(title) {
  try {
    const response = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(title)}&limit=1`);
    const data = await response.json();

    if (!data || !data.data || data.data.length === 0) {
      return "❌ I couldn't find any anime by that name, senpai.";
    }

    const anime = data.data[0];

    return `🎌 *${anime.title}* (${anime.type})
📺 Episodes: ${anime.episodes}
⭐ Score: ${anime.score || 'N/A'}
📅 Aired: ${anime.aired.string}
📖 Synopsis: ${anime.synopsis?.slice(0, 500)}...
🔗 URL: ${anime.url}`;
  } catch (error) {
    console.error("Anime fetch error:", error);
    return "⚠️ Error fetching anime info.";
  }
}

export default getAnimeInfo;
