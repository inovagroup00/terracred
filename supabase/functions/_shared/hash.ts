// Hash de PIN usando SHA-256 + salt random. Formato stored: "salt:hash" em hex.
// PIN e 4 digitos entao forca bruta e trivial — o que protege e o rate limit.

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function hashPin(pin: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltHex = toHex(salt.buffer);
  const data = new TextEncoder().encode(saltHex + ":" + pin);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return `${saltHex}:${toHex(digest)}`;
}

export async function verifyPin(pin: string, stored: string): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const data = new TextEncoder().encode(saltHex + ":" + pin);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return toHex(digest) === hashHex;
}

export function randomQrCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return "cs_" + Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function randomSmsToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}
