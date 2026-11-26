import { connection } from "next/server"
import { listApps } from "@/lib/data/apps"
import { launcherAppListSchema } from "@/lib/schemas/app"
import { loadOverrides } from "@/lib/server/app-status"

export async function GET() {
  // Install state changes at runtime, so never prerender this response.
  await connection()
  const overrides = await loadOverrides()
  return Response.json(
    {
      checkedAt: new Date().toISOString(),
      apps: launcherAppListSchema.parse(listApps(overrides)),
    },
    { headers: { "Cache-Control": "no-store" } },
  )
}
