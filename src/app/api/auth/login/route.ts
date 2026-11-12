import { NextResponse } from "next/server"
import { z } from "zod"
import { DEMO_CREDENTIALS, SESSION_COOKIE } from "@/lib/auth"

const bodySchema = z.object({ username: z.string().min(1), password: z.string().min(1) })

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter your username and password." }, { status: 400 })
  }

  const { username, password } = parsed.data
  if (username !== DEMO_CREDENTIALS.username || password !== DEMO_CREDENTIALS.password) {
    return NextResponse.json({ error: "Incorrect username or password." }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set(SESSION_COOKIE, "active", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  })
  return res
}
