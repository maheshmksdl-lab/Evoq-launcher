import type { NextRequest } from "next/server"
import { setStatus } from "@/lib/data/apps"

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

// Simulated installer. Replace with the real device / package API.
export async function POST(_req: NextRequest, ctx: RouteContext<"/api/apps/[id]/install">) {
  const { id } = await ctx.params
  await wait(1400)
  const app = setStatus(id, "installed")
  if (!app) return Response.json({ error: "Unknown app" }, { status: 404 })
  return Response.json(app)
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<"/api/apps/[id]/install">) {
  const { id } = await ctx.params
  await wait(600)
  const app = setStatus(id, "available")
  if (!app) return Response.json({ error: "Unknown app" }, { status: 404 })
  return Response.json(app)
}
