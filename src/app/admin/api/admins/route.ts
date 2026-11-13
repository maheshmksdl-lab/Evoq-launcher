import { desc } from "drizzle-orm"
import { z } from "zod"
import { getDb, schema } from "@/db"
import { audit } from "@/lib/activity"
import { actorOf, parseBody } from "@/lib/admin-api"
import { inviteAdmin } from "@/lib/auth/accounts"
import { clientIp, handle, HttpError, requireAdmin } from "@/lib/auth/guards"
import { ADMIN_ROLES } from "@/lib/permissions"

const a = schema.adminAccountUser

export const GET = () =>
  handle(async () => {
    const s = await requireAdmin("admins.manage")
    const rows = await getDb()
      .select({ id: a.id, name: a.name, email: a.email, role: a.role, status: a.status, twoFactorEnabled: a.twoFactorEnabled, lastLoginAt: a.lastLoginAt, createdAt: a.createdAt })
      .from(a)
      .orderBy(desc(a.createdAt))
    return Response.json({ admins: rows.map((r) => ({ ...r, twoFactorEnabled: Boolean(r.twoFactorEnabled), isSelf: r.id === s.admin.id })) })
  })

const inviteSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.email(),
  role: z.enum(ADMIN_ROLES),
})

// Invite an administrator. Their credentials are separate from any user account.
export const POST = (request: Request) =>
  handle(async () => {
    const s = await requireAdmin("admins.manage")
    const body = await parseBody(request, inviteSchema)
    let admin
    try {
      admin = await inviteAdmin(body)
    } catch (err) {
      throw new HttpError(409, err instanceof Error ? err.message : "Could not create the admin.")
    }
    await audit({ actor: actorOf(s), action: "admin.invite", targetType: "admin", targetId: admin.id, after: { email: admin.email, role: body.role }, ipAddress: await clientIp() })
    return Response.json({ id: admin.id }, { status: 201 })
  })
