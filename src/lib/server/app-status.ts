import "server-only"
import type { InstallStatus } from "@/lib/schemas/app"
import { getCurrentUserId } from "./current-user"
import { getSubscriptionOverrides } from "./subscriptions-store"

/**
 * The signed-in user's saved statuses. If storage is unreachable the catalog
 * still loads with default statuses; subscribe / unsubscribe itself will fail
 * loudly instead.
 */
export async function loadOverrides(): Promise<ReadonlyMap<string, InstallStatus>> {
  const userId = await getCurrentUserId()
  if (!userId) return new Map()
  try {
    return await getSubscriptionOverrides(userId)
  } catch {
    return new Map()
  }
}
