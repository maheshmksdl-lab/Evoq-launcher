import { connection } from "next/server"
import { listApps } from "@/lib/data/apps"
import { launcherAppListSchema } from "@/lib/schemas/app"

export async function GET() {
  // Install state changes at runtime, so never prerender this response.
  await connection()
  return Response.json({
    checkedAt: new Date().toISOString(),
    apps: launcherAppListSchema.parse(listApps()),
  })
}
