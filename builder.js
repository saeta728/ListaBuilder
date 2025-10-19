// builder.js — Lógica principal de ListaBuilder
const $ = id => document.getElementById(id);
let totpSecret = null;
let localData = { bloqueos: [], excepciones: [], excepcionesHorario: [] };

// --- Inicialización ---
window.addEventListener("DOMContentLoaded", async () => {
  await initTOTP();
  $("btnLogin").addEventListener("click", handleLogin);
});

// --- Login ---
async function initTOTP() {
  const url = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${SECRET_FILE}`;
  const resp = await fetch(url, { headers: { Authorization: `token ${GITHUB_TOKEN}` } });
  if (resp.ok) {
    const json = await resp.json();
    totpSecret = JSON.parse(atob(json.content)).secret;
  } else {
    totpSecret = await generateSecret();
    await pushNewSecret(totpSecret);
  }
}

async function pushNewSecret(secret) {
  const content = btoa(JSON.stringify({ secret }));
  await fetch(`https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${SECRET_FILE}`, {
    method: "PUT",
    headers: { Authorization: `token ${GITHUB_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ message: "Crear nueva clave TOTP", content }),
  });
}

async function handleLogin() {
  const code = $("totpInput").value.trim();
  const valid = await verifyTOTP(totpSecret, code);
  if (!valid) return $("statusMsg").textContent = "Código incorrecto";
  $("loginContainer").style.display = "none";
  $("mainContainer").style.display = "block";
  loadData();
}

// --- Carga de datos ---
async function loadData() {
  $("syncStatus").textContent = "Sincronizando...";
  localData = await fetchRemoteData();
  renderTables();
  $("syncStatus").textContent = "✅ Datos sincronizados.";
}

// --- Guardar datos ---
async function saveData() {
  $("syncStatus").textContent = "Subiendo a GitHub...";
  await pushDataToGitHub(localData);
  $("syncStatus").textContent = "✅ Guardado correctamente.";
}

// --- Renderización ---
function renderTables() {
  renderBlockList(localData.bloqueos);
  renderExList(localData.excepciones);
  renderExHList(localData.excepcionesHorario);
}

function renderBlockList(list) {
  const tbody = document.querySelector("#tbl tbody");
  tbody.innerHTML = "";
  list.forEach(e => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${e.domain}</td><td>${diasToTexto(e.dias)}</td><td>${horariosToTexto(e)}</td><td><button onclick="delBlock('${e.domain}')">Eliminar</button></td>`;
    tbody.appendChild(tr);
  });
}

// --- Añadir excepción con autocompletado ---
window.addEventListener("click", async e => {
  if (e.target.id === "btnAddEx") {
    const d = prompt("Dominio:");
    if (!d) return;
    const u = prompt("Ingrese URL:");
    if (!u) return;
    const title = await fetchTitleFromURL(u);
    if (!localData.excepciones) localData.excepciones = [];
    const idx = localData.excepciones.findIndex(x => x.domain === d);
    if (idx === -1) localData.excepciones.push({ domain: d, urls: [{ url: u, title }] });
    else localData.excepciones[idx].urls.push({ url: u, title });
    renderTables();
    saveData();
  }
});

// --- Utilidades ---
function diasToTexto(d) {
  const n = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
  return !d || !d.length ? "Todos" : d.map(x => n[x]).join(", ");
}
function horariosToTexto(e) {
  if (!e.horarios || !e.horarios.length) return "Todo el día";
  return e.horarios.map(h => `${h.horaInicio}-${h.horaFin}`).join(", ");
}
