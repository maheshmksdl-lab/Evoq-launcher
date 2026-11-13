"use client"

import { useState, type FormEvent, type ReactNode } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { AppWindow, ArrowLeft, Bell, KeyRound, Monitor, Palette, ShieldAlert, User, UserCircle } from "lucide-react"
import { useTheme } from "next-themes"
import { toast } from "sonner"
import { userAuthClient } from "@/lib/auth/client"
import { appsQuery } from "@/lib/queries/apps"
import { cn } from "@/lib/utils"
import { PasswordInput } from "@/components/auth/auth-forms"
import { MfaSetup } from "@/components/auth/mfa-setup"
import { TitleBar } from "@/components/launcher/chrome"
import { canOpenApp } from "@/components/launcher/app-actions"
import { AppIcon, StatusChip } from "@/components/launcher/status"
import { Badge, btn, Confirm, deviceOf, Field, fmtDateTime, inputClass, Loading, Panel, REASONS } from "@/components/admin/ui"

type Me = {
  id: string
  name: string
  email: string
  title: string | null
  phone: string | null
  twoFactorEnabled: boolean
  requireMfa: boolean
  notifications: { newSignIn: boolean; access: boolean; security: boolean }
  createdAt: string
  lastLoginAt: string | null
}

async function api<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const res = await fetch(path, {
    method: init?.method ?? "GET",
    headers: init?.body ? { "Content-Type": "application/json" } : undefined,
    body: init?.body ? JSON.stringify(init.body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error((data as { error?: string }).error ?? "Something went wrong")
  return data as T
}

const meQuery = { queryKey: ["me"], queryFn: () => api<Me>("/api/me") }

const TABS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "account", label: "Account", icon: UserCircle },
  { id: "security", label: "Security", icon: KeyRound },
  { id: "sessions", label: "Sessions", icon: Monitor },
  { id: "apps", label: "My apps", icon: AppWindow },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "appearance", label: "Appearance", icon: Palette },
] as const
type Tab = (typeof TABS)[number]["id"]

export function AccountPortal() {
  const params = useSearchParams()
  const router = useRouter()
  const tab = (TABS.find((t) => t.id === params.get("tab"))?.id ?? "profile") as Tab
  const mfaRequired = params.get("mfa") === "required"
  const { data: me, error } = useQuery(meQuery)
  const go = (t: Tab) => router.replace(`/account?tab=${t}`, { scroll: false })

  return (
    <div className="flex h-dvh flex-col">
      <TitleBar />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-5xl px-5 py-6">
          <Link href="/" className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm">
            <ArrowLeft className="size-4" /> Back to apps
          </Link>
          <h1 className="font-heading mt-2 mb-6 text-2xl font-bold tracking-tight">Account settings</h1>

          {mfaRequired && me && !me.twoFactorEnabled && (
            <div role="alert" className="mb-5 flex items-start gap-3 border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
              <ShieldAlert className="mt-0.5 size-4 shrink-0" />
              Your organisation requires two-factor authentication. Set it up below to continue using the launcher.
            </div>
          )}

          <div className="flex flex-col gap-5 md:flex-row">
            <nav aria-label="Account sections" className="md:w-52 md:shrink-0">
              <ul className="flex gap-1 overflow-x-auto [scrollbar-width:none] md:flex-col md:overflow-visible">
                {TABS.map(({ id, label, icon: Icon }) => (
                  <li key={id}>
                    <button
                      type="button"
                      onClick={() => go(id)}
                      aria-current={tab === id ? "page" : undefined}
                      className={cn(
                        "flex w-full items-center gap-2.5 px-3 py-2 text-sm whitespace-nowrap transition-colors",
                        tab === id ? "bg-selected text-foreground font-medium md:shadow-[inset_2px_0_0_var(--selected-line)]" : "text-muted-foreground hover:text-foreground hover:bg-muted",
                      )}
                    >
                      <Icon className="size-4" />
                      {label}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="min-w-0 flex-1">
              {error ? (
                <p className="text-destructive text-sm">{error.message}</p>
              ) : !me ? (
                <Loading />
              ) : (
                <>
                  {tab === "profile" && <ProfileSection key={me.id + me.name} me={me} />}
                  {tab === "account" && <AccountSection me={me} />}
                  {tab === "security" && <SecuritySection me={me} />}
                  {tab === "sessions" && <SessionsSection />}
                  {tab === "apps" && <AppsSection />}
                  {tab === "notifications" && <NotificationsSection key={JSON.stringify(me.notifications)} me={me} />}
                  {tab === "appearance" && <AppearanceSection />}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function useSaveMe() {
  const qc = useQueryClient()
  return async (body: object, message: string) => {
    try {
      await api("/api/me", { method: "PATCH", body })
      toast.success(message)
      qc.invalidateQueries({ queryKey: ["me"] })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save")
    }
  }
}

/* ---------- Profile ---------- */

function ProfileSection({ me }: { me: Me }) {
  const save = useSaveMe()
  const [form, setForm] = useState({ name: me.name, title: me.title ?? "", phone: me.phone ?? "" })
  const initials = me.name.split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase()
  return (
    <Panel title="Profile">
      <div className="mb-5 flex items-center gap-4">
        <span className="bg-evoq-soft text-evoq-indigo dark:bg-evoq-indigo/30 dark:text-evoq-tint font-heading flex size-14 items-center justify-center text-lg font-bold">{initials}</span>
        <div>
          <p className="font-medium">{me.name}</p>
          <p className="text-muted-foreground text-sm">{me.email}</p>
        </div>
      </div>
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault()
          save({ name: form.name, title: form.title || null, phone: form.phone || null }, "Profile saved")
        }}
      >
        <Field label="Full name" htmlFor="p-name">
          <input id="p-name" className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Job title" htmlFor="p-title">
            <input id="p-title" className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </Field>
          <Field label="Phone" htmlFor="p-phone">
            <input id="p-phone" type="tel" className={inputClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </Field>
        </div>
        <button type="submit" className={`${btn.primary} self-start`}>Save profile</button>
      </form>
    </Panel>
  )
}

/* ---------- Account ---------- */

function AccountSection({ me }: { me: Me }) {
  return (
    <Panel title="Account">
      <dl className="grid grid-cols-[140px_1fr] gap-x-6 gap-y-3 text-sm">
        <dt className="text-muted-foreground">Email</dt>
        <dd>{me.email}</dd>
        <dt className="text-muted-foreground">Member since</dt>
        <dd>{fmtDateTime(me.createdAt)}</dd>
        <dt className="text-muted-foreground">Last sign-in</dt>
        <dd>{fmtDateTime(me.lastLoginAt)}</dd>
      </dl>
      <p className="text-muted-foreground mt-4 text-xs">To change your email address, contact your administrator. It&apos;s also your sign-in name.</p>
    </Panel>
  )
}

/* ---------- Security ---------- */

function ChangePassword() {
  const [current, setCurrent] = useState("")
  const [next, setNext] = useState("")
  const [confirm, setConfirm] = useState("")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (next.length < 12) return setError("Use at least 12 characters.")
    if (next !== confirm) return setError("The new passwords don't match.")
    setPending(true)
    setError(null)
    const res = await userAuthClient.changePassword({ currentPassword: current, newPassword: next, revokeOtherSessions: true })
    setPending(false)
    if (res.error) return setError(res.error.message ?? "Couldn't change your password.")
    setCurrent("")
    setNext("")
    setConfirm("")
    toast.success("Password changed. Other devices were signed out.")
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <Field label="Current password" htmlFor="cp-current">
        <PasswordInput id="cp-current" value={current} onChange={setCurrent} autoComplete="current-password" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="New password" htmlFor="cp-new" hint="At least 12 characters.">
          <PasswordInput id="cp-new" value={next} onChange={setNext} autoComplete="new-password" />
        </Field>
        <Field label="Confirm new password" htmlFor="cp-confirm">
          <PasswordInput id="cp-confirm" value={confirm} onChange={setConfirm} autoComplete="new-password" />
        </Field>
      </div>
      {error && <p role="alert" className="text-destructive text-sm">{error}</p>}
      <button type="submit" className={`${btn.primary} self-start`} disabled={pending || !current || !next}>Change password</button>
    </form>
  )
}

function TwoFactor({ me }: { me: Me }) {
  const qc = useQueryClient()
  const router = useRouter()
  const [setup, setSetup] = useState(false)
  const [disablePw, setDisablePw] = useState("")
  const done = () => {
    setSetup(false)
    toast.success("Two-factor authentication is on")
    qc.invalidateQueries({ queryKey: ["me"] })
    router.refresh()
  }

  if (me.twoFactorEnabled) {
    return (
      <div className="flex flex-col gap-3">
        <p className="flex items-center gap-2 text-sm">
          <Badge tone="good">On</Badge> You&apos;ll be asked for a code from your authenticator app when you sign in.
        </p>
        {!me.requireMfa && (
          <div className="flex flex-wrap items-end gap-2">
            <div className="w-64">
              <PasswordInput id="disable-pw" value={disablePw} onChange={setDisablePw} autoComplete="current-password" />
            </div>
            <Confirm
              title="Turn off two-factor?"
              body="Your account will be protected by your password only."
              confirmLabel="Turn off"
              danger
              onConfirm={async () => {
                const res = await userAuthClient.twoFactor.disable({ password: disablePw })
                if (res.error) return void toast.error(res.error.message ?? "Couldn't turn it off. Check your password.")
                setDisablePw("")
                toast.success("Two-factor authentication is off")
                qc.invalidateQueries({ queryKey: ["me"] })
              }}
              trigger={(open) => (
                <button type="button" className={btn.danger} disabled={!disablePw} onClick={open}>Turn off with password</button>
              )}
            />
          </div>
        )}
      </div>
    )
  }
  return setup ? (
    <div className="max-w-md">
      <MfaSetup realm="user" onDone={done} />
    </div>
  ) : (
    <div className="flex flex-col items-start gap-3">
      <p className="flex items-center gap-2 text-sm">
        <Badge>Off</Badge> Add a second step to sign-in with an authenticator app.
      </p>
      <button type="button" className={btn.primary} onClick={() => setSetup(true)}>Set up two-factor</button>
    </div>
  )
}

function RecentActivity() {
  const { data } = useQuery({ queryKey: ["me", "activity"], queryFn: () => api<{ events: { id: string; success: boolean; reason: string | null; ipAddress: string | null; userAgent: string | null; createdAt: string }[] }>("/api/me/activity") })
  if (!data) return <Loading />
  if (!data.events.length) return <p className="text-muted-foreground text-sm">No sign-in activity yet.</p>
  return (
    <ul className="divide-y text-sm">
      {data.events.map((e) => (
        <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
          <span className="flex items-center gap-2">
            {e.success ? <Badge tone="good">Success</Badge> : <Badge tone="bad">Failed</Badge>}
            {REASONS[e.reason ?? ""] ?? e.reason} · {deviceOf(e.userAgent)}
          </span>
          <span className="text-muted-foreground text-xs">{e.ipAddress ?? "Unknown IP"} · {fmtDateTime(e.createdAt)}</span>
        </li>
      ))}
    </ul>
  )
}

function SecuritySection({ me }: { me: Me }) {
  return (
    <div className="flex flex-col gap-4">
      <Panel title="Password">
        <ChangePassword />
      </Panel>
      <Panel title="Two-factor authentication">
        <TwoFactor me={me} />
      </Panel>
      <Panel title="Recent sign-in activity">
        <RecentActivity />
        <p className="text-muted-foreground mt-3 text-xs">Don&apos;t recognise something? Change your password and sign out other devices.</p>
      </Panel>
    </div>
  )
}

/* ---------- Sessions ---------- */

function SessionsSection() {
  const qc = useQueryClient()
  const sessions = useQuery({
    queryKey: ["me", "sessions"],
    queryFn: async () => {
      const [list, current] = await Promise.all([userAuthClient.listSessions(), userAuthClient.getSession()])
      if (list.error) throw new Error(list.error.message ?? "Couldn't load sessions")
      return { list: list.data ?? [], currentToken: current.data?.session.token }
    },
  })
  const refresh = () => qc.invalidateQueries({ queryKey: ["me", "sessions"] })

  if (!sessions.data) return <Loading />
  const { list, currentToken } = sessions.data
  return (
    <Panel
      title={`Where you're signed in (${list.length})`}
      actions={
        list.length > 1 && (
          <button
            type="button"
            className={btn.ghost}
            onClick={async () => {
              await userAuthClient.revokeOtherSessions()
              toast.success("Signed out of all other devices")
              refresh()
            }}
          >
            Sign out other devices
          </button>
        )
      }
    >
      <ul className="divide-y text-sm">
        {list.map((s) => (
          <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
            <div>
              <p className="font-medium">
                {deviceOf(s.userAgent)} {s.token === currentToken && <Badge tone="brand">This device</Badge>}
              </p>
              <p className="text-muted-foreground text-xs">{s.ipAddress ?? "Unknown IP"} · signed in {fmtDateTime(s.createdAt)}</p>
            </div>
            {s.token !== currentToken && (
              <button
                type="button"
                className={btn.ghost}
                onClick={async () => {
                  await userAuthClient.revokeSession({ token: s.token })
                  toast.success("Device signed out")
                  refresh()
                }}
              >
                Sign out
              </button>
            )}
          </li>
        ))}
      </ul>
    </Panel>
  )
}

/* ---------- My apps ---------- */

function AppsSection() {
  const { data } = useQuery(appsQuery)
  if (!data) return <Loading />
  // Granted AND subscribed by the organisation (same rule as the launcher's Open button).
  const granted = data.apps.filter(canOpenApp)
  const requested = data.apps.filter((a) => a.access === "requested")
  const row = (a: (typeof data.apps)[number]): ReactNode => (
    <li key={a.id} className="flex items-center justify-between gap-3 py-2.5">
      <span className="flex items-center gap-3">
        <AppIcon app={a} size={32} />
        <span>
          <span className="block text-sm font-medium">{a.name}</span>
          <span className="text-muted-foreground text-xs">{a.tagline}</span>
        </span>
      </span>
      <StatusChip app={a} />
    </li>
  )
  return (
    <div className="flex flex-col gap-4">
      <Panel title={`Apps you can open (${granted.length})`}>
        {granted.length ? <ul className="divide-y">{granted.map(row)}</ul> : <p className="text-muted-foreground text-sm">You don&apos;t have access to any apps yet.</p>}
      </Panel>
      <Panel title={`Pending requests (${requested.length})`}>
        {requested.length ? <ul className="divide-y">{requested.map(row)}</ul> : <p className="text-muted-foreground text-sm">No pending requests. Request access from an app&apos;s card in the launcher.</p>}
      </Panel>
    </div>
  )
}

/* ---------- Notifications ---------- */

function NotificationsSection({ me }: { me: Me }) {
  const save = useSaveMe()
  const [n, setN] = useState(me.notifications)
  const items: { key: keyof Me["notifications"]; label: string; hint: string }[] = [
    { key: "newSignIn", label: "New sign-ins", hint: "When your account is used to sign in on a new device." },
    { key: "access", label: "Access decisions", hint: "When an admin approves or declines your app access request." },
    { key: "security", label: "Security alerts", hint: "Password changes, two-factor changes and lockouts." },
  ]
  return (
    <Panel title="Email notifications">
      <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); save({ notifications: n }, "Notification preferences saved") }}>
        {items.map((i) => (
          <label key={i.key} className="flex items-start gap-3 text-sm">
            <input type="checkbox" className="mt-0.5 accent-[var(--primary)]" checked={n[i.key]} onChange={(e) => setN({ ...n, [i.key]: e.target.checked })} />
            <span>
              <span className="font-medium">{i.label}</span>
              <span className="text-muted-foreground block text-xs">{i.hint}</span>
            </span>
          </label>
        ))}
        <button type="submit" className={`${btn.primary} self-start`}>Save preferences</button>
      </form>
    </Panel>
  )
}

/* ---------- Appearance ---------- */

function AppearanceSection() {
  const { theme, setTheme } = useTheme()
  const options = [
    { id: "light", label: "Light" },
    { id: "dark", label: "Dark" },
    { id: "system", label: "Match device" },
  ]
  return (
    <Panel title="Theme">
      <div role="radiogroup" aria-label="Theme" className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={theme === o.id}
            onClick={() => setTheme(o.id)}
            className={cn("label-mono h-9 border px-4 text-[11px] transition-colors", theme === o.id ? "bg-primary border-primary text-primary-foreground" : "bg-surface text-muted-foreground hover:text-foreground")}
          >
            {o.label}
          </button>
        ))}
      </div>
      <p className="text-muted-foreground mt-3 text-xs">Saved on this device.</p>
    </Panel>
  )
}
