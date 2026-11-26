import "server-only"
import { neon } from "@neondatabase/serverless"

let sql: ReturnType<typeof neon> | undefined

/** Shared Neon client. DATABASE_URL stays on the server. */
export function getSql() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error("DATABASE_URL is not set.")
  sql ??= neon(url)
  return sql
}
