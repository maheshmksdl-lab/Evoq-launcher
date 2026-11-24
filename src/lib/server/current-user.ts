import "server-only"
import { cookies } from "next/headers"
import { SESSION_COOKIE } from "@/lib/auth"
import { verifySessionToken } from "@/lib/session"

/** The user id from the verified session cookie, or null when not signed in. */
export async function getCurrentUserId() {
  return verifySessionToken((await cookies()).get(SESSION_COOKIE)?.value)
}
