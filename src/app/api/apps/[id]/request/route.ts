import { and, eq } from "drizzle-orm"
import type { NextRequest } from "next/server"
import { getDb, schema } from "@/db"
import { listAppsForUser } from "@/lib/apps-service"
import { handle, HttpError, requireUser } from "@/lib/auth/guards"

// A user asks for access to an app; an admin approves or denies it in the Admin Portal.
export const POST = (_req: NextRequest, ctx: RouteContext<"/api/apps/[id]/request">) =>
  handle(async () => {
    const { user } = await requireUser()
    const { id } = await ctx.params
    const app = (await listAppsForUser(user.id)).find((a) => a.id === id)
    if (!app) throw new HttpError(404, "Unknown app")
    if (app.status === "coming-soon") throw new HttpError(400, `${app.name} isn't available yet.`)
    if (app.access === "granted") throw new HttpError(400, `You already have access to ${app.name}.`)

    const db = getDb()
    const [pending] = await db
      .select({ id: schema.accessRequests.id })
      .from(schema.accessRequests)
      .where(and(eq(schema.accessRequests.userId, user.id), eq(schema.accessRequests.appId, id), eq(schema.accessRequests.status, "pending")))
    if (!pending) {
      await db.insert(schema.accessRequests).values({ id: crypto.randomUUID(), userId: user.id, appId: id })
    }
    return Response.json({ ...app, access: "requested" })
  })
