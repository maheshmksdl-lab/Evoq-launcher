"use client"

import { useEffect, useState, type FormEvent } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { fieldClass, FormError, PasswordInput, primaryBtn } from "@/components/auth/auth-forms"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function AdminSetupForm() {
  const router = useRouter()
  const params = useSearchParams()
  const token = params.get("token") ?? ""
  const [needed, setNeeded] = useState<boolean | null>(null)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/admin/api/setup")
      .then((r) => r.json())
      .then((d) => setNeeded(Boolean(d.needed)))
      .catch(() => setNeeded(false))
  }, [])

  if (needed === null) return <p className="text-muted-foreground text-sm">Checking…</p>
  if (!needed)
    return (
      <p className="text-sm">
        Setup is already complete. <Link href="/admin/login" className="text-evoq-interactive hover:underline">Go to admin sign-in</Link>
      </p>
    )
  if (!token) return <p className="text-sm">Open the setup link that includes the setup token from your deployment settings.</p>

  async function submit(e: FormEvent) {
    e.preventDefault()
    setPending(true)
    setError(null)
    const res = await fetch("/admin/api/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, name, email, password }),
    })
    const data = await res.json().catch(() => ({}))
    setPending(false)
    if (!res.ok) return setError(data.error ?? "Setup failed.")
    router.replace("/admin/login?setup=1")
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Full name</Label>
        <Input id="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className={fieldClass} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Admin email</Label>
        <Input id="email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} className={fieldClass} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Password</Label>
        <PasswordInput id="password" value={password} onChange={setPassword} autoComplete="new-password" />
        <p className="text-muted-foreground text-xs">At least 12 characters. You&apos;ll set up two-factor authentication next.</p>
      </div>
      <FormError>{error}</FormError>
      <Button type="submit" disabled={pending} size="lg" className={primaryBtn}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        Create Super Admin
      </Button>
    </form>
  )
}
