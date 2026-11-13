import { listAppsForUser } from "@/lib/apps-service"
import { handle, requireUser } from "@/lib/auth/guards"
import { launcherAppListSchema } from "@/lib/schemas/app"
import { getSetting } from "@/lib/settings"

// The catalog as the signed-in user sees it (status + their own access).
export const GET = () =>
  handle(async () => {
    const { user } = await requireUser()
    const [apps, general] = await Promise.all([listAppsForUser(user.id), getSetting("general")])
    return Response.json({ checkedAt: new Date().toISOString(), banner: general.maintenanceBanner || null, apps: launcherAppListSchema.parse(apps) })
  })
