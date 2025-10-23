// Obtiene título de una URL
async function fetchTitle(url) {
  try {
    const resp = await fetch(`https://corsproxy.io/?${encodeURIComponent(url)}`);
    const html = await resp.text();
    const match = html.match(/<title>(.*?)<\/title>/i);
    return match ? match[1].trim() : "(sin título)";
  } catch {
    return "(sin título)";
  }
}
