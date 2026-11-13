"use client"

import { twoFactorClient } from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/react"

/* Browser clients for the two separate sign-in realms. */

export const userAuthClient = createAuthClient({ basePath: "/api/auth", plugins: [twoFactorClient()] })
export const adminAuthClient = createAuthClient({ basePath: "/admin/api/auth", plugins: [twoFactorClient()] })

/** Posts email + password to the realm's sign-in route (lockout + activity logging). */
export async function signInWithPassword(realm: "user" | "admin", email: string, password: string) {
  const res = await fetch(realm === "user" ? "/api/sign-in" : "/admin/api/sign-in", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  })
  const data = (await res.json().catch(() => ({}))) as { error?: string; message?: string; twoFactorRedirect?: boolean }
  if (!res.ok) return { ok: false as const, error: data.error ?? data.message ?? "Could not sign in." }
  return { ok: true as const, twoFactor: Boolean(data.twoFactorRedirect) }
}
