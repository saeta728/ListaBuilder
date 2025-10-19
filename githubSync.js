// githubSync.js — sincronización bidireccional TuListaFavorita ↔ ListaBuilder
let remoteSha = null;

async function fetchRemoteData() {
  const url = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${DATA_FILE}`;
  const res = await fetch(url, { headers: { Authorization: `token ${GITHUB_TOKEN}` } });
  if (!res.ok) throw new Error("Error al obtener datos remotos");
  const json = await res.json();
  remoteSha = json.sha;
  return JSON.parse(decodeURIComponent(escape(atob(json.content))));
}

async function pushDataToGitHub(data) {
  const url = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${DATA_FILE}`;
  const body = {
    message: "Actualización desde ListaBuilder",
    content: btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2)))),
    sha: remoteSha,
  };
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Error al subir datos a GitHub");
  const json = await res.json();
  remoteSha = json.content.sha;
}
