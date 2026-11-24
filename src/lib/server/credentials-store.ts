import "server-only"
import { neon } from "@neondatabase/serverless"
import { decrypt, encrypt } from "./encryption"

export type StoredCredentials = { username: string; password: string }

let sql: ReturnType<typeof neon> | undefined
let schemaReady: Promise<unknown> | undefined

function db() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error("DATABASE_URL is not set.")
  sql ??= neon(url)
  return sql
}

async function ready() {
  const q = db()
  schemaReady ??= q`
    CREATE TABLE IF NOT EXISTS app_credentials (
      user_id    text        NOT NULL,
      app_id     text        NOT NULL,
      payload    text        NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (user_id, app_id)
    )`.catch((e: unknown) => {
    schemaReady = undefined
    throw e
  })
  await schemaReady
  return q
}

const aad = (userId: string, appId: string) => `${userId}\u0000${appId}`

/** App ids that have saved credentials. Never returns secrets. */
export async function listCredentialAppIds(userId: string) {
  const q = await ready()
  const rows = (await q`SELECT app_id FROM app_credentials WHERE user_id = ${userId}`) as { app_id: string }[]
  return rows.map((r) => r.app_id)
}

export async function getCredentials(userId: string, appId: string): Promise<StoredCredentials | null> {
  const q = await ready()
  const rows = (await q`SELECT payload FROM app_credentials WHERE user_id = ${userId} AND app_id = ${appId}`) as {
    payload: string
  }[]
  if (!rows[0]) return null
  return JSON.parse(decrypt(rows[0].payload, aad(userId, appId)))
}

export async function saveCredentials(userId: string, appId: string, value: StoredCredentials) {
  const q = await ready()
  const payload = encrypt(JSON.stringify(value), aad(userId, appId))
  await q`
    INSERT INTO app_credentials (user_id, app_id, payload) VALUES (${userId}, ${appId}, ${payload})
    ON CONFLICT (user_id, app_id) DO UPDATE SET payload = EXCLUDED.payload, updated_at = now()`
}

export async function deleteCredentials(userId: string, appId: string) {
  const q = await ready()
  await q`DELETE FROM app_credentials WHERE user_id = ${userId} AND app_id = ${appId}`
}
