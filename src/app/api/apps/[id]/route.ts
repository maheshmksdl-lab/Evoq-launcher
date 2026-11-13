import type { NextRequest } from "next/server"
import { listAppsForUser } from "@/lib/apps-service"
import { handle, HttpError, requireUser } from "@/lib/auth/guards"
import { appDetails } from "@/lib/data/app-details"
import { appDetailsResponseSchema } from "@/lib/schemas/app"

export const GET = (_req: NextRequest, ctx: RouteContext<"/api/apps/[id]">) =>
  handle(async () => {
    const { user } = await requireUser()
    const { id } = await ctx.params
    const app = (await listAppsForUser(user.id)).find((a) => a.id === id)
    const details = appDetails[id]
    if (!app || !details) throw new HttpError(404, "Unknown app")
    return Response.json(appDetailsResponseSchema.parse({ app, details }))
  })
