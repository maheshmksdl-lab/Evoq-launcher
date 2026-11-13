import { and, eq } from "drizzle-orm"
import type { NextRequest } from "next/server"
import { z } from "zod"
import { getDb, schema } from "@/db"
import { handle, HttpError, requireUser } from "@/lib/auth/guards"
import { findCatalogApp } from "@/lib/data/apps"
import { encryptPassword } from "@/lib/vault"

type Ctx = RouteContext<"/api/saved-logins/[appId]">

const bodySchema = z.object({
  username: z.string().trim().min(1, "Enter the username").max(200),
  password: z.string().min(1, "Enter the password").max(500),
})

// Save or replace this user's login for one app.
export const PUT = (request: NextRequest, ctx: Ctx) =>
  handle(async () => {
    const { user } = await requireUser()
    const { appId } = await ctx.params
    if (!findCatalogApp(appId)) throw new HttpError(404, "Unknown app.")
    const parsed = bodySchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) throw new HttpError(400, parsed.error.issues[0]?.message ?? "Check the form.")
    const passwordEnc = encryptPassword(user.id, appId, parsed.data.password)
    await getDb()
      .insert(schema.savedLogins)
      .values({ userId: user.id, appId, username: parsed.data.username, passwordEnc })
      .onConflictDoUpdate({ target: [schema.savedLogins.userId, schema.savedLogins.appId], set: { username: parsed.data.username, passwordEnc, updatedAt: new Date() } })
    return Response.json({ appId, username: parsed.data.username })
  })

export const DELETE = (_req: NextRequest, ctx: Ctx) =>
  handle(async () => {
    const { user } = await requireUser()
    const { appId } = await ctx.params
    await getDb().delete(schema.savedLogins).where(and(eq(schema.savedLogins.userId, user.id), eq(schema.savedLogins.appId, appId)))
    return Response.json({ ok: true })
  })
