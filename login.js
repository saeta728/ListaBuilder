document.getElementById("btnLogin").addEventListener("click", async () => {
  const code = document.getElementById("totpInput").value.trim();
  const status = document.getElementById("status");

  if (code.length !== 6) {
    status.textContent = "Código inválido (6 dígitos).";
    return;
  }

  status.textContent = "Verificando...";

  try {
    const secret = await getTOTPSecret();
    const valid = await generateTOTP(secret);

    if (valid === code) {
      status.style.color = "green";
      status.textContent = "Acceso concedido.";
      setTimeout(() => {
        window.location.href = "index.html";
      }, 800);
    } else {
      status.style.color = "red";
      status.textContent = "Código incorrecto. Intente de nuevo.";
    }
  } catch (err) {
    console.error(err);
    status.textContent = "Error verificando el código.";
  }
});

// Permitir presionar Enter
document.getElementById("totpInput").addEventListener("keyup", e => {
  if (e.key === "Enter") document.getElementById("btnLogin").click();
});
