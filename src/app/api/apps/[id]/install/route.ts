import type { NextRequest } from "next/server"
import { getApp } from "@/lib/data/apps"
import { getCurrentUserId } from "@/lib/server/current-user"
import { saveSubscription } from "@/lib/server/subscriptions-store"
import { loadOverrides } from "@/lib/server/app-status"

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

type Ctx = RouteContext<"/api/apps/[id]/install">

/** Saves the signed-in user's choice, so it persists across logins and devices. */
async function change(ctx: Ctx, status: "installed" | "available", delayMs: number) {
  const userId = await getCurrentUserId()
  if (!userId) return Response.json({ error: "Not signed in." }, { status: 401 })

  const { id } = await ctx.params
  const current = getApp(id)
  if (!current) return Response.json({ error: "Unknown app" }, { status: 404 })
  if (current.status === "coming-soon") return Response.json({ error: "This app is not available yet." }, { status: 400 })

  await wait(delayMs)
  try {
    await saveSubscription(userId, id, status)
  } catch {
    return Response.json({ error: "Could not save your subscription. Try again." }, { status: 500 })
  }
  return Response.json(getApp(id, await loadOverrides()))
}

// Simulated installer delay. Replace with the real device / package API.
export async function POST(_req: NextRequest, ctx: Ctx) {
  return change(ctx, "installed", 1400)
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  return change(ctx, "available", 600)
}
