// titleFetcher.js — obtiene el título de una URL o video automáticamente
async function fetchTitleFromURL(url) {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com") && u.searchParams.get("v")) {
      const id = u.searchParams.get("v");
      const ytApi = `https://noembed.com/embed?url=${encodeURIComponent(url)}`;
      const res = await fetch(ytApi);
      if (res.ok) {
        const json = await res.json();
        return json.title || "Video de YouTube";
      }
    } else {
      const resp = await fetch(url, { method: "GET", mode: "cors" });
      const text = await resp.text();
      const match = text.match(/<title>(.*?)<\/title>/i);
      return match ? match[1].trim() : "Página sin título";
    }
  } catch (e) {
    console.warn("Error al obtener título:", e);
    return "(sin título)";
  }
}
