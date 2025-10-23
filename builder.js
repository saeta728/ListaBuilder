// builder.js - ListaBuilder v2.0
let connected = false;
let totpSecret = null;

// Comunicación con extensión local
async function sendToExtension(cmd, data={}) {
  return new Promise(resolve => {
    window.postMessage({ type: "LISTABUILDER_CMD", cmd, data }, "*");
    window.addEventListener("message", e => {
      if (e.data?.type === "LISTABUILDER_RESP" && e.data.cmd === cmd) resolve(e.data.data);
    }, { once: true });
  });
}

// Iniciar autenticación
document.getElementById("btnLogin").addEventListener("click", async () => {
  const code = document.getElementById("totpCode").value.trim();
  const res = await sendToExtension("verifyTOTP", { code });
  if (res?.ok) {
    document.getElementById("loginSection").style.display = "none";
    document.getElementById("mainUI").style.display = "block";
    connected = true;
    loadLists();
  } else {
    document.getElementById("loginStatus").textContent = "Código inválido.";
  }
});

async function loadLists() {
  const res = await sendToExtension("getLists");
  renderAll(res.bloqueos, res.excepciones, res.excepcionesHorario);
}

function renderAll(blocks, ex, exh) {
  renderTable("tblBlocks", blocks, ["domain","dias","horarios"]);
  renderTable("tblEx", ex, ["domain","urls"]);
  renderTable("tblExH", exh, ["domain","urls","dias","horarios"]);
}

function renderTable(tblId, data, fields) {
  const tbody = document.querySelector(`#${tblId} tbody`);
  tbody.innerHTML = "";
  (data||[]).forEach(row => {
    const tr = document.createElement("tr");
    fields.forEach(f => {
      const td = document.createElement("td");
      td.textContent = typeof row[f] === "object" ? JSON.stringify(row[f]) : row[f] || "";
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
}
