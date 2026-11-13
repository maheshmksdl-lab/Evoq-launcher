import "server-only"
import { createCipheriv, createDecipheriv, createHmac, hkdfSync, randomBytes, timingSafeEqual } from "node:crypto"

/*
 * Encryption for users' saved app logins.
 *  - AES-256-GCM, a fresh random IV per value.
 *  - The key is derived (HKDF) from the master key SAVED_LOGIN_KEY for each
 *    user + app, and the user + app are also bound in as authenticated data, so
 *    a value can't be decrypted for, or moved to, another user or app.
 *  - Nothing here is ever logged.
 */

function masterKey(): Buffer {
  const raw = process.env.SAVED_LOGIN_KEY
  const key = raw ? Buffer.from(raw, "base64") : null
  if (!key || key.length < 32) throw new Error("SAVED_LOGIN_KEY is missing or too short (needs 32 random bytes, base64).")
  return key
}

const derive = (info: string, salt: string) => Buffer.from(hkdfSync("sha256", masterKey(), Buffer.from(salt), Buffer.from(info), 32))

const aad = (userId: string, appId: string) => Buffer.from(`${userId}:${appId}`)

export function encryptPassword(userId: string, appId: string, password: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", derive(`saved-login:${appId}`, userId), iv)
  cipher.setAAD(aad(userId, appId))
  const data = Buffer.concat([cipher.update(password, "utf8"), cipher.final()])
  return ["v1", iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), data.toString("base64url")].join(".")
}

export function decryptPassword(userId: string, appId: string, value: string): string {
  const [version, iv, tag, data] = value.split(".")
  if (version !== "v1" || !iv || !tag || !data) throw new Error("Unsupported saved login format.")
  const decipher = createDecipheriv("aes-256-gcm", derive(`saved-login:${appId}`, userId), Buffer.from(iv, "base64url"))
  decipher.setAAD(aad(userId, appId))
  decipher.setAuthTag(Buffer.from(tag, "base64url"))
  return Buffer.concat([decipher.update(Buffer.from(data, "base64url")), decipher.final()]).toString("utf8")
}

/* ---------- Short-lived "unlocked" marker ---------- */

export const UNLOCK_COOKIE = "evoq_vault"
export const UNLOCK_SECONDS = 5 * 60

const unlockMac = (userId: string, exp: number) => createHmac("sha256", derive("unlock", "evoq-vault")).update(`${userId}.${exp}`).digest("base64url")

/** Signed value proving this user re-entered their launcher password in the last few minutes. */
export function makeUnlockToken(userId: string): string {
  const exp = Math.floor(Date.now() / 1000) + UNLOCK_SECONDS
  return `${exp}.${unlockMac(userId, exp)}`
}

export function isUnlocked(userId: string, token: string | undefined): boolean {
  if (!token) return false
  const [expRaw, mac] = token.split(".")
  const exp = Number(expRaw)
  if (!Number.isFinite(exp) || !mac || exp < Date.now() / 1000) return false
  const expected = Buffer.from(unlockMac(userId, exp))
  const given = Buffer.from(mac)
  return expected.length === given.length && timingSafeEqual(expected, given)
}
