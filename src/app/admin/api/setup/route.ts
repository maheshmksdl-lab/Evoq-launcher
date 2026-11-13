import { timingSafeEqual } from "node:crypto"
import { count } from "drizzle-orm"
import { z } from "zod"
import { getDb, schema } from "@/db"
import { audit } from "@/lib/activity"
import { createFirstSuperAdmin } from "@/lib/auth/accounts"
import { handle, HttpError } from "@/lib/auth/guards"
import { SESSION_POLICY } from "@/lib/settings"

/*
 * One-time creation of the first Super Admin. Works only while no admin exists
 * and only with the ADMIN_SETUP_TOKEN deployment secret.
 */

async function adminCount() {
  const [row] = await getDb().select({ n: count() }).from(schema.adminAccountUser)
  return row?.n ?? 0
}

export const GET = () => handle(async () => Response.json({ needed: (await adminCount()) === 0 }))

const bodySchema = z.object({
  token: z.string().min(1),
  name: z.string().trim().min(1).max(80),
  email: z.email(),
  password: z.string().min(SESSION_POLICY.minPasswordLength).max(128),
})

const sameSecret = (a: string, b: string) => {
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}

export const POST = (request: Request) =>
  handle(async () => {
    const expected = process.env.ADMIN_SETUP_TOKEN
    if (!expected) throw new HttpError(503, "Setup is not enabled on this deployment.")
    if ((await adminCount()) > 0) throw new HttpError(409, "Setup has already been completed.")

    const parsed = bodySchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) throw new HttpError(400, `Check the form. Passwords need at least ${SESSION_POLICY.minPasswordLength} characters.`)
    if (!sameSecret(parsed.data.token, expected)) throw new HttpError(403, "This setup link is not valid.")

    const admin = await createFirstSuperAdmin(parsed.data)
    await audit({ actor: { id: admin.id, email: admin.email }, action: "admin.setup", targetType: "admin", targetId: admin.id, after: { role: "super_admin" } })
    return Response.json({ ok: true })
  })
