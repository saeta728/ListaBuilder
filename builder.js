// builder.js — ListaBuilder v2.0
const $ = id => document.getElementById(id);

let totpSecret = "SECRET_LISTABUILDER"; // mismo secreto guardado en tu repo o en Local
let localData = { bloqueos: [], excepciones: [], excepcionesHorario: [] };

// --- Inicialización ---
window.addEventListener("DOMContentLoaded", async () => {
  $("btnLogin").addEventListener("click", handleLogin);
  autoSyncData(); // sincroniza incluso si no se ha iniciado sesión
});

// --- Login ---
async function handleLogin() {
  const code = $("totpInput").value.trim();
  const valid = await verifyTOTP(totpSecret, code);
  if (!valid) return $("statusMsg").textContent = "Código incorrecto";

  $("loginContainer").style.display = "none";
  $("mainContainer").style.display = "block";
  loadData();
}

// --- Sincronización con SelecTime Local (por mensaje directo) ---
async function loadData() {
  $("syncStatus").textContent = "Sincronizando...";
  try {
    const extensionId = "YOUR_EXTENSION_ID"; // reemplazar por el ID real de SelecTime Local
    const response = await chrome.runtime.sendMessage(extensionId, { action: "getData" });
    localData = response;
    renderTables();
    $("syncStatus").textContent = "✅ Datos sincronizados.";
  } catch (e) {
    $("syncStatus").textContent = "⚠️ No se pudo contactar con SelecTime Local.";
  }
}

async function saveData() {
  $("syncStatus").textContent = "Subiendo a Local...";
  try {
    const extensionId = "YOUR_EXTENSION_ID";
    await chrome.runtime.sendMessage(extensionId, { action: "setData", data: localData });
    $("syncStatus").textContent = "✅ Guardado correctamente.";
  } catch (e) {
    $("syncStatus").textContent = "⚠️ No se pudo subir datos a Local.";
  }
}


// --- Sincronización automática en segundo plano ---
async function autoSyncData() {
  await loadData();
  setInterval(async () => { await saveData(); }, 30000); // cada 30 s
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
    tr.innerHTML = `<td>${e.domain}</td><td>${diasToTexto(e.dias)}</td><td>${horariosToTexto(e)}</td>
    <td><button onclick="delBlock('${e.domain}')">Eliminar</button></td>`;
    tbody.appendChild(tr);
  });
}

function renderExList(list) {
  const tbody = document.querySelector("#tblEx tbody");
  tbody.innerHTML = "";
  list.forEach(e => {
    const urls = e.urls.map(u => `<li>${u.title}</li>`).join("");
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${e.domain}</td><td><ul>${urls}</ul></td>
    <td><button onclick="delEx('${e.domain}')">Eliminar</button></td>`;
    tbody.appendChild(tr);
  });
}

function renderExHList(list) {
  const tbody = document.querySelector("#tblExH tbody");
  tbody.innerHTML = "";
  list.forEach(e => {
    const urls = e.urls.map(u => `<li>${u.title}</li>`).join("");
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${e.domain}</td><td><ul>${urls}</ul></td><td>${diasToTexto(e.dias)}</td>
    <td>${horariosToTexto(e)}</td><td><button onclick="delExH('${e.domain}')">Eliminar</button></td>`;
    tbody.appendChild(tr);
  });
}

// --- Utilidades ---
function diasToTexto(d) {
  const n = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
  return !d || !d.length ? "Todos" : d.map(x => n[x]).join(", ");
}
function horariosToTexto(e) {
  if (!e.horarios || !e.horarios.length) return "Todo el día";
  return e.horarios.map(h => `${h.horaInicio}-${h.horaFin}`).join(", ");
}
