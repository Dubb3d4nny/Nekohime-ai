// anime.js
// Fetch anime info + recommendations + streaming links for Nekohime
export async function fetchAnimeAndSimilarByName(animeName) {
  try {
    // 1. Search anime by name
    const searchRes = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(animeName)}&limit=1`);
    const searchData = await searchRes.json();
    if (!searchData.data || searchData.data.length === 0) {
      return { text: `❌ No anime found for "${animeName}".` };
    }
    const anime = searchData.data[0];

    // 2. Get full details
    const detailsRes = await fetch(`https://api.jikan.moe/v4/anime/${anime.mal_id}`);
    const detailsData = await detailsRes.json();
    const info = detailsData.data;

    // 3. Extract genres
    const genres = info.genres?.map(g => g.name).join(", ") || "N/A";

    // 4. Generate streaming/search links for the main anime
    const mainLinks = generateExtraLinks(info.title);

    // 5. Fetch recommendations
    const recRes = await fetch(`https://api.jikan.moe/v4/anime/${anime.mal_id}/recommendations`);
    const recData = await recRes.json();

    let recList = "None found.";
    if (recData.data && recData.data.length > 0) {
      recList = recData.data.slice(0, 5).map(rec => {
        const title = rec.entry.title;
        const links = generateExtraLinks(title);
        return `🔹 *${title}*  
AniList: ${links.anilist}  
Crunchyroll: ${links.crunchyroll}  
AnimePahe: ${links.animepahe}`;
      }).join("\n\n");
    }

    // 6. Format message text
    const messageText = `
✨ *${info.title}* ✨
📊 Score: ${info.score || "N/A"}
🎬 Episodes: ${info.episodes || "N/A"}
📅 Aired: ${info.aired?.string || "N/A"}
🏷️ Genres: ${genres}
📝 Synopsis: ${info.synopsis?.slice(0, 300) || "N/A"}...

🔗 *Streaming/Search Links*:
AniList: ${mainLinks.anilist}
Crunchyroll: ${mainLinks.crunchyroll}
AnimePahe: ${mainLinks.animepahe}

📌 *Similar Recommendations*:
${recList}
    `.trim();

    // Return both image + text for Nekohime to send
    return {
      image: { url: info.images.jpg.image_url },
      caption: messageText
    };

  } catch (err) {
    console.error("Error fetching anime:", err);
    return { text: "⚠️ Sorry, something went wrong while fetching anime info." };
  }
}

// Helper function to generate streaming/search links
function generateExtraLinks(title) {
  return {
    anilist: `https://anilist.co/search/anime?search=${encodeURIComponent(title)}`,
    crunchyroll: `https://www.crunchyroll.com/search?from=search&q=${encodeURIComponent(title)}`,
    animepahe: `https://animepahe.ru/?q=${encodeURIComponent(title)}`
  };
}
