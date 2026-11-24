/*
 * Signed session tokens (HMAC-SHA256). Uses Web Crypto so it runs in both the
 * proxy and route handlers. The secret comes from SESSION_SECRET and never
 * reaches the browser.
 */
const encoder = new TextEncoder()
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7

export class SessionConfigError extends Error {}

function toB64u(bytes: Uint8Array) {
  let s = ""
  for (const b of bytes) s += String.fromCharCode(b)
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function fromB64u(value: string) {
  const s = atob(value.replace(/-/g, "+").replace(/_/g, "/"))
  return Uint8Array.from(s, (c) => c.charCodeAt(0))
}

async function getKey() {
  const secret = process.env.SESSION_SECRET
  if (!secret || secret.length < 32) {
    throw new SessionConfigError("SESSION_SECRET must be set to at least 32 characters.")
  }
  return crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"])
}

export async function createSessionToken(userId: string) {
  const payload = toB64u(
    encoder.encode(JSON.stringify({ sub: userId, exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE })),
  )
  const sig = await crypto.subtle.sign("HMAC", await getKey(), encoder.encode(payload))
  return `${payload}.${toB64u(new Uint8Array(sig))}`
}

/** Returns the signed-in user id, or null for a missing, forged or expired token. */
export async function verifySessionToken(token: string | undefined): Promise<string | null> {
  if (!token) return null
  const [payload, sig, extra] = token.split(".")
  if (!payload || !sig || extra !== undefined) return null
  try {
    const ok = await crypto.subtle.verify("HMAC", await getKey(), fromB64u(sig), encoder.encode(payload))
    if (!ok) return null
    const { sub, exp } = JSON.parse(new TextDecoder().decode(fromB64u(payload)))
    if (typeof sub !== "string" || !sub || typeof exp !== "number" || exp < Date.now() / 1000) return null
    return sub
  } catch {
    return null
  }
}
