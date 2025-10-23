// Obtiene título de una página o video (auto para YouTube y genérico)
async function getTitleFromURL(url) {
  try {
    const res = await fetch(url);
    const html = await res.text();
    const match = html.match(/<title>(.*?)<\/title>/i);
    return match ? match[1].trim() : "(sin título)";
  } catch {
    return "(sin título)";
  }
}
