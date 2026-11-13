"use client"

import { useState, type FormEvent } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Eye, EyeOff, KeyRound, Loader2, LogIn } from "lucide-react"
import { adminAuthClient, signInWithPassword, userAuthClient } from "@/lib/auth/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Realm = "user" | "admin"
const client = (realm: Realm) => (realm === "user" ? userAuthClient : adminAuthClient)
const MIN_PASSWORD = 12

export const fieldClass = "h-10 rounded-none"
export const primaryBtn = "mt-1 h-10 w-full rounded-none bg-evoq-indigo hover:bg-evoq-interactive"

export function FormError({ children }: { children?: string | null }) {
  if (!children) return null
  return (
    <p role="alert" className="text-destructive text-sm">
      {children}
    </p>
  )
}

export function PasswordInput({ id, value, onChange, autoComplete }: { id: string; value: string; onChange: (v: string) => void; autoComplete: string }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <Input
        id={id}
        type={show ? "text" : "password"}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${fieldClass} pr-10`}
        required
      />
      <button
        type="button"
        aria-label={show ? "Hide password" : "Show password"}
        onClick={() => setShow((v) => !v)}
        className="text-muted-foreground hover:text-foreground absolute top-1/2 right-0 flex h-10 w-10 -translate-y-1/2 items-center justify-center outline-none"
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  )
}

/** Email + password, then (if enabled) a two-factor code or backup code. */
export function SignInForm({ realm }: { realm: Realm }) {
  const router = useRouter()
  const params = useSearchParams()
  const [step, setStep] = useState<"password" | "code">("password")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [code, setCode] = useState("")
  const [useBackup, setUseBackup] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const home = realm === "user" ? "/" : "/admin"
  const done = () => {
    const from = params.get("from")
    const safe = from && from.startsWith(realm === "user" ? "/" : "/admin") && !from.startsWith("//") ? from : home
    router.replace(safe)
    router.refresh()
  }

  async function submitPassword(e: FormEvent) {
    e.preventDefault()
    setPending(true)
    setError(null)
    const res = await signInWithPassword(realm, email, password)
    setPending(false)
    setPassword("")
    if (!res.ok) return setError(res.error)
    if (res.twoFactor) return setStep("code")
    // Admins without MFA are sent to set it up by the route protection.
    done()
  }

  async function submitCode(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!useBackup) {
      // Catch the common mistake before it reaches the server: typing the long
      // setup key (or anything that isn't 6 digits) instead of the app's code.
      const digits = code.replace(/\s/g, "")
      if (!/^\d{6}$/.test(digits)) {
        return setError(
          digits.length > 8 || /[a-z]/i.test(digits)
            ? "That looks like the setup key. Enter the 6-digit code your authenticator app is showing right now."
            : "Enter the 6 digits shown in your authenticator app.",
        )
      }
    }
    setPending(true)
    const c = client(realm)
    const res = useBackup
      ? await c.twoFactor.verifyBackupCode({ code: code.trim() })
      : await c.twoFactor.verifyTotp({ code: code.replace(/\s/g, "") })
    setPending(false)
    if (res.error) return setError(res.error.message ?? "That code didn't work. Try again.")
    done()
  }

  if (step === "code") {
    return (
      <form onSubmit={submitCode} className="flex flex-col gap-4" noValidate>
        <p className="text-muted-foreground text-sm">
          {useBackup ? "Enter one of your backup codes." : "Enter the 6-digit code from your authenticator app. It changes every 30 seconds."}
        </p>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="code">{useBackup ? "Backup code" : "Authentication code"}</Label>
          <Input
            id="code"
            inputMode={useBackup ? "text" : "numeric"}
            maxLength={useBackup ? 40 : 12}
            placeholder={useBackup ? "" : "123456"}
            autoComplete="one-time-code"
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className={`${fieldClass} font-mono tracking-widest`}
            required
          />
        </div>
        <FormError>{error}</FormError>
        <Button type="submit" disabled={pending || code.trim().length < 6} size="lg" className={primaryBtn}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
          Verify
        </Button>
        <button type="button" onClick={() => { setUseBackup((v) => !v); setCode(""); setError(null) }} className="text-evoq-interactive self-start text-xs hover:underline">
          {useBackup ? "Use authenticator app instead" : "Use a backup code instead"}
        </button>
      </form>
    )
  }

  return (
    <form onSubmit={submitPassword} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">{realm === "admin" ? "Admin email" : "Email"}</Label>
        <Input id="email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} className={fieldClass} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Link href={realm === "user" ? "/forgot-password" : "/admin/reset-password?forgot=1"} className="text-evoq-interactive text-xs hover:underline">
            Forgot password?
          </Link>
        </div>
        <PasswordInput id="password" value={password} onChange={setPassword} autoComplete="current-password" />
      </div>
      <FormError>{error}</FormError>
      <Button type="submit" disabled={pending} size="lg" className={primaryBtn}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4" />}
        {pending ? "Signing in…" : "Log in"}
      </Button>
    </form>
  )
}

/** Sends a password-reset link. Always shows the same message so accounts can't be discovered. */
export function ForgotPasswordForm({ realm }: { realm: Realm }) {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [pending, setPending] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setPending(true)
    await client(realm).requestPasswordReset({ email, redirectTo: realm === "user" ? "/reset-password" : "/admin/reset-password" })
    setPending(false)
    setSent(true)
  }

  if (sent) return <p className="text-sm">If an account exists for <b>{email}</b>, we&apos;ve sent a link to reset the password. It expires in 1 hour.</p>

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={fieldClass} required />
      </div>
      <Button type="submit" disabled={pending} size="lg" className={primaryBtn}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        Send reset link
      </Button>
    </form>
  )
}

/** Sets a new password from an emailed link (also used for invitations). */
export function ResetPasswordForm({ realm }: { realm: Realm }) {
  const router = useRouter()
  const params = useSearchParams()
  const token = params.get("token")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(params.get("error") ? "This link is invalid or has expired. Ask for a new one." : null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (password.length < MIN_PASSWORD) return setError(`Use at least ${MIN_PASSWORD} characters.`)
    if (password !== confirm) return setError("The passwords don't match.")
    if (!token) return setError("This link is invalid or has expired. Ask for a new one.")
    setPending(true)
    setError(null)
    const res = await client(realm).resetPassword({ newPassword: password, token })
    setPending(false)
    if (res.error) return setError(res.error.message ?? "This link is invalid or has expired. Ask for a new one.")
    router.replace(realm === "user" ? "/login?reset=1" : "/admin/login?reset=1")
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="new-password">New password</Label>
        <PasswordInput id="new-password" value={password} onChange={setPassword} autoComplete="new-password" />
        <p className="text-muted-foreground text-xs">At least {MIN_PASSWORD} characters. A short phrase works well.</p>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirm-password">Confirm password</Label>
        <PasswordInput id="confirm-password" value={confirm} onChange={setConfirm} autoComplete="new-password" />
      </div>
      <FormError>{error}</FormError>
      <Button type="submit" disabled={pending} size="lg" className={primaryBtn}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        Set password
      </Button>
    </form>
  )
}
