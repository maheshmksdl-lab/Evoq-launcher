import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getAdminSession, getUserSession } from "@/lib/auth/guards"
import { getSetting } from "@/lib/settings"

/*
 * First line of defence: every request is checked against a real session in the
 * database (not just the presence of a cookie). Route handlers check again, with
 * permissions, so this is never the only protection.
 *   /admin/**  → admin realm (separate accounts, cookies and sessions)
 *   everything else → user realm
 */

const USER_PUBLIC_PAGES = new Set(["/login", "/forgot-password", "/reset-password"])
const ADMIN_PUBLIC_PAGES = new Set(["/admin/login", "/admin/setup", "/admin/reset-password"])
const USER_PUBLIC_API = ["/api/auth/", "/api/sign-in"]
const ADMIN_PUBLIC_API = ["/admin/api/auth/", "/admin/api/sign-in", "/admin/api/setup"]

const unauthorized = (message: string) => NextResponse.json({ error: message }, { status: 401 })
const redirect = (request: NextRequest, path: string, from?: string) => {
  const url = new URL(path, request.url)
  if (from && from !== "/") url.searchParams.set("from", from)
  return NextResponse.redirect(url)
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  /* ---------- Admin realm ---------- */
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    if (ADMIN_PUBLIC_API.some((p) => pathname.startsWith(p))) return NextResponse.next()
    const session = await getAdminSession(request.headers)

    if (ADMIN_PUBLIC_PAGES.has(pathname)) {
      if (session && pathname === "/admin/login") return redirect(request, session.mfaEnabled ? "/admin" : "/admin/mfa")
      return NextResponse.next()
    }
    if (pathname.startsWith("/admin/api/")) return session ? NextResponse.next() : unauthorized("Admin sign-in required.")
    if (!session) return redirect(request, "/admin/login", pathname)
    if (!session.mfaEnabled && pathname !== "/admin/mfa") return redirect(request, "/admin/mfa")
    return NextResponse.next()
  }

  /* ---------- User realm ---------- */
  if (USER_PUBLIC_API.some((p) => pathname.startsWith(p))) return NextResponse.next()
  const session = await getUserSession(request.headers)

  if (USER_PUBLIC_PAGES.has(pathname)) {
    if (session && pathname === "/login") return redirect(request, "/")
    return NextResponse.next()
  }
  if (pathname.startsWith("/api/")) return session ? NextResponse.next() : unauthorized("Please sign in.")
  if (!session) return redirect(request, "/login", pathname)

  // Organisation policy: users must set up two-factor before using the launcher.
  const twoFactorEnabled = Boolean((session.user as { twoFactorEnabled?: boolean | null }).twoFactorEnabled)
  if (!twoFactorEnabled && pathname !== "/account") {
    const { requireUserMfa } = await getSetting("security")
    if (requireUserMfa) {
      const url = new URL("/account", request.url)
      url.searchParams.set("tab", "security")
      url.searchParams.set("mfa", "required")
      return NextResponse.redirect(url)
    }
  }
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|logos|characters|brand|screens).*)"],
}
