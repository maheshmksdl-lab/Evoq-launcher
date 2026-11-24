import type { NextRequest } from "next/server"
import { z } from "zod"
import { deleteCredentials, getCredentials, saveCredentials } from "@/lib/server/credentials-store"
import { getCurrentUserId } from "@/lib/server/current-user"
import { badRequest, noStore, serverError, unauthorized } from "../http"

const appIdSchema = z.string().regex(/^[a-z0-9][a-z0-9_-]{0,63}$/i)
const bodySchema = z.object({
  username: z.string().trim().min(1).max(256),
  password: z.string().min(1).max(1024),
})

type Ctx = RouteContext<"/api/credentials/[appId]">

// The user always comes from the signed session cookie, never from the request,
// so changing the app id can only ever touch the caller's own rows.
async function authorize(ctx: Ctx) {
  const userId = await getCurrentUserId()
  if (!userId) return { error: unauthorized() } as const
  const appId = appIdSchema.safeParse((await ctx.params).appId)
  if (!appId.success) return { error: badRequest("Invalid app id.") } as const
  return { userId, appId: appId.data } as const
}

export async function GET(_req: NextRequest, ctx: Ctx) {
  const auth = await authorize(ctx)
  if ("error" in auth) return auth.error
  try {
    const credentials = await getCredentials(auth.userId, auth.appId)
    return credentials ? noStore(credentials) : noStore({ error: "No saved credentials." }, 404)
  } catch {
    return serverError()
  }
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  const auth = await authorize(ctx)
  if ("error" in auth) return auth.error
  const body = bodySchema.safeParse(await req.json().catch(() => null))
  if (!body.success) return badRequest("Enter a username and password.")
  try {
    await saveCredentials(auth.userId, auth.appId, body.data)
    return noStore({ ok: true })
  } catch {
    return serverError()
  }
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const auth = await authorize(ctx)
  if ("error" in auth) return auth.error
  try {
    await deleteCredentials(auth.userId, auth.appId)
    return noStore({ ok: true })
  } catch {
    return serverError()
  }
}
