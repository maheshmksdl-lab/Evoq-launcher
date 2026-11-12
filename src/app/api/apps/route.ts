import { launcherApps } from "@/lib/data/apps"
import { launcherAppListSchema } from "@/lib/schemas/app"

export async function GET() {
  return Response.json(launcherAppListSchema.parse(launcherApps))
}
