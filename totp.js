// totp.js — autenticación TOTP unificada con SelecTime Local

async function getTOTPSecret() {
  // Intenta obtenerlo desde localStorage
  let secret = localStorage.getItem("totpSecret");
  if (secret) return secret;

  // Si no está, solicita a SelecTime Local
  return new Promise((resolve, reject) => {
    window.postMessage({ type: "LISTABUILDER_CMD", cmd: "getTOTPSecret" }, "*");
    const handler = (e) => {
      if (e.data?.type === "LISTABUILDER_RESP" && e.data.cmd === "getTOTPSecret") {
        window.removeEventListener("message", handler);
        if (e.data.data?.secret) {
          localStorage.setItem("totpSecret", e.data.data.secret);
          resolve(e.data.data.secret);
        } else reject("No se recibió secreto");
      }
    };
    window.addEventListener("message", handler);
  });
}

async function verifyTOTPFromInput(code) {
  const secret = await getTOTPSecret();
  return generateTOTP(secret).then((valid) => valid === code);
}

function generateTOTP(secret) {
  const key = new Uint8Array(atob(secret).split('').map(c => c.charCodeAt(0)));
  const epoch = Math.floor(Date.now() / 30000);
  const msg = new ArrayBuffer(8);
  new DataView(msg).setUint32(4, epoch);
  return crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign'])
    .then(k => crypto.subtle.sign('HMAC', k, msg))
    .then(sig => {
      const hmac = new Uint8Array(sig);
      const offset = hmac[hmac.length - 1] & 0xf;
      const bin = ((hmac[offset] & 0x7f) << 24) |
                  ((hmac[offset + 1] & 0xff) << 16) |
                  ((hmac[offset + 2] & 0xff) << 8) |
                  (hmac[offset + 3] & 0xff);
      return (bin % 1e6).toString().padStart(6, '0');
    });
}
