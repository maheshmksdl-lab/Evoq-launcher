import { eq } from "drizzle-orm"
import { z } from "zod"
import { getDb, schema } from "@/db"
import { handle, HttpError, requireUser } from "@/lib/auth/guards"
import { getSetting } from "@/lib/settings"

// The signed-in user's own profile and preferences (User Portal).
export const GET = () =>
  handle(async () => {
    const { user } = await requireUser()
    const [row] = await getDb().select().from(schema.userAccountUser).where(eq(schema.userAccountUser.id, user.id))
    if (!row) throw new HttpError(404, "Account not found.")
    const security = await getSetting("security")
    return Response.json({
      id: row.id,
      name: row.name,
      email: row.email,
      image: row.image,
      title: row.title,
      phone: row.phone,
      twoFactorEnabled: Boolean(row.twoFactorEnabled),
      requireMfa: security.requireUserMfa,
      notifications: { newSignIn: row.notifyNewSignIn, access: row.notifyAccess, security: row.notifySecurity },
      createdAt: row.createdAt,
      lastLoginAt: row.lastLoginAt,
    })
  })

const patchSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  title: z.string().trim().max(80).nullable().optional(),
  phone: z.string().trim().max(40).nullable().optional(),
  notifications: z.object({ newSignIn: z.boolean(), access: z.boolean(), security: z.boolean() }).optional(),
})

export const PATCH = (request: Request) =>
  handle(async () => {
    const { user } = await requireUser()
    const parsed = patchSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) throw new HttpError(400, "Check the highlighted fields.")
    const { notifications, ...profile } = parsed.data
    await getDb()
      .update(schema.userAccountUser)
      .set({
        ...profile,
        ...(notifications && { notifyNewSignIn: notifications.newSignIn, notifyAccess: notifications.access, notifySecurity: notifications.security }),
        updatedAt: new Date(),
      })
      .where(eq(schema.userAccountUser.id, user.id))
    return Response.json({ ok: true })
  })
