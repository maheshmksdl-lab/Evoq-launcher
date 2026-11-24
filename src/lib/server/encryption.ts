import "server-only"
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto"

/*
 * AES-256-GCM. The key is CREDENTIALS_ENCRYPTION_KEY: 32 random bytes, base64.
 * `aad` binds a ciphertext to its owner and app, so a row copied to another
 * user or app fails to decrypt.
 */
function getKey() {
  const key = Buffer.from(process.env.CREDENTIALS_ENCRYPTION_KEY ?? "", "base64")
  if (key.length !== 32) throw new Error("CREDENTIALS_ENCRYPTION_KEY must be 32 bytes, base64-encoded.")
  return key
}

export function encrypt(plaintext: string, aad: string) {
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv)
  cipher.setAAD(Buffer.from(aad))
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()])
  return ["v1", iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), ct.toString("base64url")].join(".")
}

export function decrypt(payload: string, aad: string) {
  const [version, iv, tag, ct] = payload.split(".")
  if (version !== "v1" || !iv || !tag || !ct) throw new Error("Unsupported credential format.")
  const decipher = createDecipheriv("aes-256-gcm", getKey(), Buffer.from(iv, "base64url"))
  decipher.setAAD(Buffer.from(aad))
  decipher.setAuthTag(Buffer.from(tag, "base64url"))
  return Buffer.concat([decipher.update(Buffer.from(ct, "base64url")), decipher.final()]).toString("utf8")
}
