import { listCredentialAppIds } from "@/lib/server/credentials-store"
import { getCurrentUserId } from "@/lib/server/current-user"
import { noStore, serverError, unauthorized } from "./http"

/** Which apps have saved credentials for the signed-in user. No secrets. */
export async function GET() {
  const userId = await getCurrentUserId()
  if (!userId) return unauthorized()
  try {
    return noStore({ appIds: await listCredentialAppIds(userId) })
  } catch {
    return serverError()
  }
}
