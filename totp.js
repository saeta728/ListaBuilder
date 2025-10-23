// totp.js — manejo local de TOTP
async function generateSecret() {
  const array = new Uint8Array(10);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
}

function generateTOTP(secret) {
  const key = Uint8Array.from(atob(secret), c => c.charCodeAt(0));
  const epoch = Math.floor(Date.now() / 1000);
  const time = Math.floor(epoch / 30);
  const msg = new ArrayBuffer(8);
  const view = new DataView(msg);
  view.setUint32(4, time);
  return crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-1" }, false, ["sign"])
    .then(k => crypto.subtle.sign("HMAC", k, msg))
    .then(sig => {
      const offset = new Uint8Array(sig)[19] & 0xf;
      const bin = ((new Uint8Array(sig)[offset] & 0x7f) << 24) |
                  ((new Uint8Array(sig)[offset+1] & 0xff) << 16) |
                  ((new Uint8Array(sig)[offset+2] & 0xff) << 8) |
                  (new Uint8Array(sig)[offset+3] & 0xff);
      return (bin % 1e6).toString().padStart(6, "0");
    });
}
