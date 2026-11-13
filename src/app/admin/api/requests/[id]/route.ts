import { eq } from "drizzle-orm"
import type { NextRequest } from "next/server"
import { z } from "zod"
import { getDb, schema } from "@/db"
import { audit } from "@/lib/activity"
import { actorOf, parseBody } from "@/lib/admin-api"
import { clientIp, handle, HttpError, requireAdmin } from "@/lib/auth/guards"
import { sendEmail } from "@/lib/email"
import { findCatalogApp } from "@/lib/data/apps"

/*
 * Approve or deny an access request. Approving grants the user access; if the
 * organisation doesn't subscribe to the app yet, the approver also needs
 * apps.manage and the app is subscribed as part of the approval.
 */
export const POST = (request: NextRequest, ctx: RouteContext<"/admin/api/requests/[id]">) =>
  handle(async () => {
    const s = await requireAdmin("access.manage")
    const { id } = await ctx.params
    const { decision } = await parseBody(request, z.object({ decision: z.enum(["approve", "deny"]) }))
    const db = getDb()
    const [req] = await db.select().from(schema.accessRequests).where(eq(schema.accessRequests.id, id))
    if (!req) throw new HttpError(404, "Request not found.")
    if (req.status !== "pending") throw new HttpError(409, "This request has already been decided.")
    const app = findCatalogApp(req.appId)

    if (decision === "approve") {
      const [setting] = await db.select().from(schema.appSettings).where(eq(schema.appSettings.appId, req.appId))
      if (setting?.status === "coming-soon") throw new HttpError(409, `${app?.name ?? "This app"} isn't available yet.`)
      if (setting?.status === "available") {
        if (!s.permissions.includes("apps.manage")) throw new HttpError(403, `Your organisation doesn't subscribe to ${app?.name ?? "this app"}. Ask an Admin to subscribe first.`)
        await db.update(schema.appSettings).set({ status: "installed", updatedAt: new Date() }).where(eq(schema.appSettings.appId, req.appId))
      }
      await db.insert(schema.userAppAccess).values({ userId: req.userId, appId: req.appId, grantedBy: s.admin.id }).onConflictDoNothing()
    }
    await db.update(schema.accessRequests).set({ status: decision === "approve" ? "approved" : "denied", decidedBy: s.admin.id, decidedAt: new Date() }).where(eq(schema.accessRequests.id, id))
    await audit({ actor: actorOf(s), action: `request.${decision}`, targetType: "request", targetId: id, after: { userId: req.userId, appId: req.appId }, ipAddress: await clientIp() })

    const [user] = await db.select().from(schema.userAccountUser).where(eq(schema.userAccountUser.id, req.userId))
    if (user?.notifyAccess) {
      await sendEmail({
        to: user.email,
        subject: `Access to ${app?.name ?? req.appId} ${decision === "approve" ? "approved" : "declined"}`,
        text: decision === "approve" ? `Hi ${user.name},\n\nYou can now open ${app?.name} from the EVOQ Launcher.` : `Hi ${user.name},\n\nYour request for ${app?.name} was declined. Contact your administrator for details.`,
      }).catch(() => undefined)
    }
    return Response.json({ ok: true })
  })
