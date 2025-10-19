async function generateSecret() {
  const array = new Uint8Array(20);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array)).replace(/=/g, '').substring(0, 32);
}

function getTOTP(secret) {
  const key = base32ToBytes(secret);
  const epoch = Math.floor(Date.now() / 1000);
  const time = Math.floor(epoch / 30);
  const msg = new ArrayBuffer(8);
  const view = new DataView(msg);
  view.setUint32(4, time);
  return crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign'])
    .then(k => crypto.subtle.sign('HMAC', k, msg))
    .then(sig => {
      const h = new Uint8Array(sig);
      const offset = h[h.length - 1] & 0xf;
      const code = ((h[offset] & 0x7f) << 24) | ((h[offset + 1] & 0xff) << 16) |
                   ((h[offset + 2] & 0xff) << 8) | (h[offset + 3] & 0xff);
      return (code % 1e6).toString().padStart(6, '0');
    });
}

async function verifyTOTP(secret, code) {
  const valid = await getTOTP(secret);
  return code === valid;
}

function base32ToBytes(base32) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  for (let i = 0; i < base32.length; i++) {
    const val = alphabet.indexOf(base32.charAt(i).toUpperCase());
    bits += val.toString(2).padStart(5, '0');
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8)
    bytes.push(parseInt(bits.substring(i, i + 8), 2));
  return new Uint8Array(bytes);
}
