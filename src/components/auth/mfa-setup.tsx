"use client"

import { useState, type FormEvent } from "react"
import { Check, Copy, Loader2, ShieldCheck } from "lucide-react"
import QRCode from "qrcode"
import { adminAuthClient, userAuthClient } from "@/lib/auth/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { fieldClass, FormError, PasswordInput, primaryBtn } from "./auth-forms"

/**
 * Two-factor enrolment with an authenticator app:
 *  1. confirm password → 2. scan QR + save backup codes → 3. enter a code.
 * The secret is only shown as a QR code / setup key during enrolment.
 */
export function MfaSetup({ realm, onDone }: { realm: "user" | "admin"; onDone: () => void }) {
  const client = realm === "user" ? userAuthClient : adminAuthClient
  const [step, setStep] = useState<"password" | "scan">("password")
  const [password, setPassword] = useState("")
  const [qr, setQr] = useState<string | null>(null)
  const [setupKey, setSetupKey] = useState<string | null>(null)
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [code, setCode] = useState("")
  const [copied, setCopied] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function start(e: FormEvent) {
    e.preventDefault()
    setPending(true)
    setError(null)
    const res = await client.twoFactor.enable({ password })
    setPending(false)
    setPassword("")
    if (res.error || !res.data || res.data.method !== "totp") return setError(res.error?.message ?? "Couldn't start setup. Check your password.")
    const uri = res.data.totpURI
    setSetupKey(new URL(uri).searchParams.get("secret"))
    setQr(await QRCode.toDataURL(uri, { margin: 1, width: 192 }))
    setBackupCodes(res.data.backupCodes)
    setStep("scan")
  }

  async function verify(e: FormEvent) {
    e.preventDefault()
    setPending(true)
    setError(null)
    const res = await client.twoFactor.verifyTotp({ code: code.replace(/\s/g, "") })
    setPending(false)
    if (res.error) return setError(res.error.message ?? "That code didn't work. Check your device's clock and try again.")
    onDone()
  }

  if (step === "password") {
    return (
      <form onSubmit={start} className="flex flex-col gap-4">
        <p className="text-muted-foreground text-sm">Confirm your password to set up an authenticator app such as Microsoft Authenticator, Google Authenticator or 1Password.</p>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="mfa-password">Current password</Label>
          <PasswordInput id="mfa-password" value={password} onChange={setPassword} autoComplete="current-password" />
        </div>
        <FormError>{error}</FormError>
        <Button type="submit" disabled={pending || !password} size="lg" className={primaryBtn}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
          Continue
        </Button>
      </form>
    )
  }

  return (
    <form onSubmit={verify} className="flex flex-col gap-5">
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
        {qr && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qr} alt="QR code for your authenticator app" width={160} height={160} className="border" />
        )}
        <div className="text-sm">
          <p className="font-medium">1. Scan this code with your authenticator app.</p>
          {setupKey && (
            <p className="text-muted-foreground mt-2 text-xs">
              Can&apos;t scan? Enter this key: <span className="text-foreground font-mono break-all">{setupKey}</span>
            </p>
          )}
        </div>
      </div>

      <div className="bg-muted/60 border p-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">2. Save your backup codes</p>
          <button
            type="button"
            onClick={async () => {
              await navigator.clipboard.writeText(backupCodes.join("\n"))
              setCopied(true)
            }}
            className="text-evoq-interactive inline-flex items-center gap-1 text-xs hover:underline"
          >
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />} {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <p className="text-muted-foreground mt-1 text-xs">Each code works once if you lose your device. Store them somewhere safe.</p>
        <ul className="mt-2 grid grid-cols-2 gap-1 font-mono text-xs">
          {backupCodes.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="mfa-code">3. Enter the 6-digit code from the app</Label>
        <Input id="mfa-code" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value)} className={`${fieldClass} font-mono tracking-widest`} required />
      </div>
      <FormError>{error}</FormError>
      <Button type="submit" disabled={pending || code.replace(/\s/g, "").length < 6} size="lg" className={primaryBtn}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        Turn on two-factor authentication
      </Button>
    </form>
  )
}
