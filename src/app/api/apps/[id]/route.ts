import type { NextRequest } from "next/server"
import { appDetails } from "@/lib/data/app-details"
import { getApp } from "@/lib/data/apps"
import { appDetailsResponseSchema } from "@/lib/schemas/app"
import { loadOverrides } from "@/lib/server/app-status"

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/apps/[id]">) {
  const { id } = await ctx.params
  const app = getApp(id, await loadOverrides())
  const details = appDetails[id]
  if (!app || !details) return Response.json({ error: "Unknown app" }, { status: 404 })
  return Response.json(appDetailsResponseSchema.parse({ app, details }))
}
