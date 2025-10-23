// builder.js — UI ListaBuilder v2.0 (sin conexión directa a GitHub)
const $ = id => document.getElementById(id);
let totpSecret = null;
let lists = { bloqueos: [], excepciones: [], excepcionesHorario: [] };

async function verifyTOTP(code) {
  const expected = await generateTOTP(totpSecret);
  return expected === code.trim();
}

// comunicación con extensión local
function sendToLocal(action, payload={}) {
  return new Promise((resolve) => {
    window.postMessage({ from:"ListaBuilder", action, payload }, "*");
    window.addEventListener("message", (e)=>{
      if(e.data.from==="SelecTime" && e.data.action===action+"_response"){
        resolve(e.data.payload);
      }
    }, { once:true });
  });
}

async function loadLists() {
  const data = await sendToLocal("getLists");
  lists = data || { bloqueos:[], excepciones:[], excepcionesHorario:[] };
  renderAll();
}

function renderAll() {
  renderBlockList(lists.bloqueos);
  renderExList(lists.excepciones);
  renderExHList(lists.excepcionesHorario);
}

function renderBlockList(list) {
  const tbody = $("tbl").querySelector("tbody");
  tbody.innerHTML = "";
  for (const e of list) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${e.domain}</td><td>${(e.dias||[]).join(",")}</td>
      <td>${(e.horarios||[]).map(h=>h.horaInicio+"-"+h.horaFin).join(",")}</td>
      <td><button class='edit'>Editar</button><button class='del'>Eliminar</button></td>`;
    tbody.appendChild(tr);
  }
}

function renderExList(list) {
  const tbody = $("tblEx").querySelector("tbody");
  tbody.innerHTML = "";
  for (const e of list) {
    const tr = document.createElement("tr");
    const urls = (e.urls||[]).map(u=>`<div>${u.title||"(sin título)"} — <a href="${u.url}" target="_blank">${u.url}</a></div>`).join("");
    tr.innerHTML = `<td>${e.domain}</td><td>${urls}</td>
      <td><button class='edit'>Editar</button><button class='del'>Eliminar</button></td>`;
    tbody.appendChild(tr);
  }
}

function renderExHList(list) {
  const tbody = $("tblExH").querySelector("tbody");
  tbody.innerHTML = "";
  for (const e of list) {
    const urls = (e.urls||[]).map(u=>`<div>${u.title||"(sin título)"} — <a href="${u.url}" target="_blank">${u.url}</a></div>`).join("");
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${e.domain}</td><td>${urls}</td><td>${(e.dias||[]).join(",")}</td>
      <td>${(e.horarios||[]).map(h=>h.horaInicio+"-"+h.horaFin).join(",")}</td>
      <td><button class='edit'>Editar</button><button class='del'>Eliminar</button></td>`;
    tbody.appendChild(tr);
  }
}

$("btnLogin").addEventListener("click", async ()=>{
  const code = $("totpInput").value;
  if(await verifyTOTP(code)) {
    $("authArea").style.display="none";
    $("mainUI").style.display="block";
    loadLists();
  } else {
    alert("Código incorrecto");
  }
});

window.addEventListener("load", async ()=>{
  const res = await sendToLocal("getTotpSecret");
  totpSecret = res.secret;
});
