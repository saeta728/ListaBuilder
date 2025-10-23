// builder.js — ListaBuilder v2.0
const $ = id => document.getElementById(id);

let totpSecret = "GLXP7MMCBSGJYPEEFJNKKFCM5Y"; // mismo secreto del Authenticator
let localData = { bloqueos: [], excepciones: [], excepcionesHorario: [] };
let ghUser = "", ghRepo = "TuListaFavorita", ghToken = "";
let lastSyncHash = "";

// --- Inicialización ---
window.addEventListener("DOMContentLoaded", async () => {
  $("btnLogin").addEventListener("click", handleLogin);
  await loadGitHubCreds();
});

// --- Cargar credenciales GitHub de SelecTime ---
async function loadGitHubCreds() {
  const creds = await chrome.storage.local.get(["githubUser", "githubRepo", "githubToken"]);
  ghUser = creds.githubUser || "";
  ghRepo = creds.githubRepo || "TuListaFavorita";
  ghToken = creds.githubToken || "";
}

// --- Login ---
async function handleLogin() {
  const code = $("totpInput").value.trim();
  const valid = await verifyTOTP(totpSecret, code);
  if (!valid) return $("statusMsg").textContent = "Código incorrecto";

  $("loginContainer").style.display = "none";
  $("mainContainer").style.display = "block";
  await syncFromGitHub();
  renderTables();
  startWatchChanges();
}

// --- Sincronización GitHub (bidireccional) ---
async function syncFromGitHub() {
  try {
    const url = `https://api.github.com/repos/${ghUser}/${ghRepo}/contents/datos_sync.json`;
    const resp = await fetch(url, { headers: { Authorization: `token ${ghToken}` } });
    if (!resp.ok) throw new Error("No se pudo obtener datos.");
    const data = await resp.json();
    const decoded = JSON.parse(atob(data.content));
    localData = decoded;
    lastSyncHash = data.sha;
    $("syncStatus").textContent = "✅ Sincronizado desde GitHub.";
    renderTables();
  } catch (e) {
    $("syncStatus").textContent = "⚠️ Error al descargar datos.";
  }
}

async function syncToGitHub() {
  try {
    const url = `https://api.github.com/repos/${ghUser}/${ghRepo}/contents/datos_sync.json`;
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(localData, null, 2))));
    const body = JSON.stringify({
      message: "Actualización ListaBuilder",
      content: encoded,
      sha: lastSyncHash || undefined,
    });
    const resp = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `token ${ghToken}`,
        "Content-Type": "application/json",
      },
      body,
    });
    if (!resp.ok) throw new Error("Error al subir");
    const result = await resp.json();
    lastSyncHash = result.content.sha;
    $("syncStatus").textContent = "✅ Cambios sincronizados con GitHub.";
  } catch (e) {
    $("syncStatus").textContent = "⚠️ No se pudo subir datos.";
  }
}

// --- Detectar cambios locales ---
function startWatchChanges() {
  const observer = new MutationObserver(syncToGitHub);
  observer.observe(document.querySelector("#tbl"), { childList: true, subtree: true });
  observer.observe(document.querySelector("#tblEx"), { childList: true, subtree: true });
  observer.observe(document.querySelector("#tblExH"), { childList: true, subtree: true });
}

// --- Renderización de tablas ---
function renderTables() {
  renderBlockList(localData.bloqueos);
  renderExList(localData.excepciones);
  renderExHList(localData.excepcionesHorario);
}

function renderBlockList(list) {
  const tbody = document.querySelector("#tbl tbody");
  tbody.innerHTML = "";
  (list || []).forEach((e, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${e.domain}</td>
      <td>${diasToTexto(e.dias)}</td>
      <td>${horariosToTexto(e)}</td>
      <td>
        <button onclick="delBlock(${i})">Eliminar</button>
      </td>`;
    tbody.appendChild(tr);
  });
}

function renderExList(list) {
  const tbody = document.querySelector("#tblEx tbody");
  tbody.innerHTML = "";
  (list || []).forEach((e, i) => {
    const urls = e.urls.map(u => `<li>${u.title || u.url}</li>`).join("");
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${e.domain}</td>
      <td><ul>${urls}</ul></td>
      <td>
        <button onclick="delEx(${i})">Eliminar</button>
      </td>`;
    tbody.appendChild(tr);
  });
}

function renderExHList(list) {
  const tbody = document.querySelector("#tblExH tbody");
  tbody.innerHTML = "";
  (list || []).forEach((e, i) => {
    const urls = e.urls.map(u => `<li>${u.title || u.url}</li>`).join("");
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${e.domain}</td>
      <td><ul>${urls}</ul></td>
      <td>${diasToTexto(e.dias)}</td>
      <td>${horariosToTexto(e)}</td>
      <td>
        <button onclick="delExH(${i})">Eliminar</button>
      </td>`;
    tbody.appendChild(tr);
  });
}

// --- Botones de acción ---
$("btnAdd").onclick = () => {
  const domain = prompt("Dominio a agregar:");
  if (!domain) return;
  localData.bloqueos.push({ domain, dias: [], horarios: [] });
  renderTables();
  syncToGitHub();
};

function delBlock(i) {
  localData.bloqueos.splice(i, 1);
  renderTables();
  syncToGitHub();
}

$("btnAddEx").onclick = () => {
  const domain = prompt("Dominio de excepción:");
  if (!domain) return;
  localData.excepciones.push({ domain, urls: [] });
  renderTables();
  syncToGitHub();
};

function delEx(i) {
  localData.excepciones.splice(i, 1);
  renderTables();
  syncToGitHub();
}

$("btnAddExH").onclick = () => {
  const domain = prompt("Dominio con horario:");
  if (!domain) return;
  localData.excepcionesHorario.push({ domain, urls: [], dias: [], horarios: [] });
  renderTables();
  syncToGitHub();
};

function delExH(i) {
  localData.excepcionesHorario.splice(i, 1);
  renderTables();
  syncToGitHub();
}

// --- Utilidades ---
function diasToTexto(d) {
  const n = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  return !d || !d.length ? "Todos" : d.map(x => n[x]).join(", ");
}

function horariosToTexto(e) {
  if (!e.horarios || !e.horarios.length) return "Todo el día";
  return e.horarios.map(h => `${h.horaInicio}-${h.horaFin}`).join(", ");
}
