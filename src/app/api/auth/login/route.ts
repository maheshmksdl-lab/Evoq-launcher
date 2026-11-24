import { NextResponse } from "next/server"
import { z } from "zod"
import { DEMO_CREDENTIALS, SESSION_COOKIE } from "@/lib/auth"
import { createSessionToken, SESSION_MAX_AGE } from "@/lib/session"

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

  let token: string
  try {
    token = await createSessionToken(username)
  } catch {
    return NextResponse.json({ error: "Sign-in is not configured on the server." }, { status: 500 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  })
  return res
}
