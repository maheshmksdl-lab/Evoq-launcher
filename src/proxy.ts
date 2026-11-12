import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { SESSION_COOKIE } from "@/lib/auth"

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hasSession = request.cookies.has(SESSION_COOKIE)

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
