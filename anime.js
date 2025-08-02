import fetch from 'node-fetch';

export async function getAnimeInfo(title) {
  try {
    const res = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(title)}&limit=1`);
    const data = await res.json();

    if (!data.data || data.data.length === 0) return "❌ No anime found.";

    const anime = data.data[0];

    return `📺 *${anime.title}* (${anime.year})
🎭 Genre: ${anime.genres.map(g => g.name).join(', ')}
📊 Score: ${anime.score}
📝 Synopsis: ${anime.synopsis?.substring(0, 300)}...
🔗 More: ${anime.url}`;
  } catch (err) {
    console.error("Anime fetch error:", err);
    return "⚠️ Failed to fetch anime info.";
  }
}