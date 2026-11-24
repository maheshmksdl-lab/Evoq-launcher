import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { SESSION_COOKIE } from "@/lib/auth"
import { verifySessionToken } from "@/lib/session"

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hasSession = (await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value)) !== null

  if (pathname === "/login") {
    if (hasSession) return NextResponse.redirect(new URL("/", request.url))
    return NextResponse.next()
  }

  if (!hasSession) {
    const url = new URL("/login", request.url)
    url.searchParams.set("from", pathname)
    return NextResponse.redirect(url)
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|logos|characters|brand|screens).*)"],
}
