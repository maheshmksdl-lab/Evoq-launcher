"use client"

import { useState, type ReactNode } from "react"
import { useMutation, useQuery, useQueryClient, type QueryKey } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

/* ---------- Data helpers ---------- */

export async function adminFetch<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const res = await fetch(path, {
    method: init?.method ?? "GET",
    headers: init?.body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `Request failed (${res.status})`)
  return data as T
}

export const useAdminQuery = <T,>(key: QueryKey, path: string) => useQuery({ queryKey: key, queryFn: () => adminFetch<T>(path) })

/** Mutation that shows a toast and refreshes the given queries on success. */
export function useAdminMutation<V>(fn: (v: V) => Promise<unknown>, opts: { success: string | ((v: V) => string); invalidate: QueryKey[] }) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: (_d, v) => {
      toast.success(typeof opts.success === "function" ? opts.success(v) : opts.success)
      opts.invalidate.forEach((k) => qc.invalidateQueries({ queryKey: k }))
    },
    onError: (err) => toast.error(err.message),
  })
}

/* ---------- Layout pieces ---------- */

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">{title}</h1>
        {description && <p className="text-muted-foreground mt-1 text-sm">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export function Panel({ title, actions, children, className }: { title?: string; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("bg-surface border", className)}>
      {title && (
        <header className="flex items-center justify-between gap-3 border-b px-4 py-3">
          <h2 className="label-mono text-muted-foreground text-[10px]">{title}</h2>
          {actions}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  )
}

export function StatTile({ label, value, hint, tone }: { label: string; value: number | string; hint?: string; tone?: "warn" }) {
  return (
    <div className="bg-surface border px-4 py-3">
      <p className="label-mono text-muted-foreground text-[10px]">{label}</p>
      <p className={cn("font-heading mt-1 text-3xl font-bold tabular-nums", tone === "warn" && Number(value) > 0 && "text-amber-600 dark:text-amber-400")}>{value}</p>
      {hint && <p className="text-muted-foreground mt-0.5 text-xs">{hint}</p>}
    </div>
  )
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "good" | "warn" | "bad" | "brand" }) {
  const tones = {
    neutral: "border-border bg-muted text-muted-foreground",
    good: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
    warn: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
    bad: "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300",
    brand: "border-evoq-tint bg-evoq-soft text-evoq-interactive dark:border-evoq-mid/60 dark:bg-evoq-indigo/30 dark:text-evoq-tint",
  }
  return <span className={cn("label-mono inline-flex h-5 items-center border px-1.5 text-[10px] leading-none whitespace-nowrap", tones[tone])}>{children}</span>
}

export const btn = {
  primary: "label-mono bg-primary text-primary-foreground hover:bg-evoq-interactive inline-flex h-9 items-center justify-center gap-2 px-4 font-semibold transition-colors disabled:opacity-50",
  secondary: "label-mono bg-surface text-foreground hover:border-evoq-tint inline-flex h-9 items-center justify-center gap-2 border px-4 font-semibold transition-colors disabled:opacity-50",
  danger: "label-mono inline-flex h-9 items-center justify-center gap-2 border border-red-300 px-4 font-semibold text-red-700 transition-colors hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/40",
  ghost: "text-evoq-interactive dark:text-evoq-bright text-xs font-medium hover:underline disabled:opacity-50",
}

/** Base input style; width comes from the context (Field makes it full width). */
export const inputClass =
  "bg-surface placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/40 h-9 border px-3 text-sm outline-none focus-visible:ring-3 disabled:opacity-60"

export function Field({ label, htmlFor, hint, children }: { label: string; htmlFor: string; hint?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 [&>input]:w-full [&>select]:w-full">
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
    </div>
  )
}

/* ---------- Tables ---------- */

export function Table({ head, children, empty }: { head: string[]; children: ReactNode; empty?: boolean }) {
  return (
    <div className="overflow-x-auto border">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead className="bg-surface">
          <tr className="border-b">
            {head.map((h, i) => (
              <th key={i} className="label-mono text-muted-foreground px-3 py-2.5 text-left text-[10px] font-normal">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
      {empty && <p className="text-muted-foreground px-3 py-8 text-center text-sm">Nothing to show yet.</p>}
    </div>
  )
}

export const td = "border-b px-3 py-2.5 align-middle"

export function Loading() {
  return (
    <div className="text-muted-foreground flex items-center gap-2 py-10 text-sm">
      <Loader2 className="size-4 animate-spin" /> Loading…
    </div>
  )
}

export function ErrorNote({ error }: { error: Error | null }) {
  return error ? <p className="text-destructive py-6 text-sm">{error.message}</p> : null
}

/* ---------- Confirmation ---------- */

export function Confirm({
  trigger,
  title,
  body,
  confirmLabel,
  danger,
  onConfirm,
}: {
  trigger: (open: () => void) => ReactNode
  title: string
  body: string
  confirmLabel: string
  danger?: boolean
  onConfirm: () => Promise<unknown> | void
}) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  return (
    <>
      {trigger(() => setOpen(true))}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-none sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{body}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="rounded-none">
            <button type="button" className={btn.secondary} onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button
              type="button"
              disabled={busy}
              className={danger ? btn.danger : btn.primary}
              onClick={async () => {
                setBusy(true)
                try {
                  await onConfirm()
                  setOpen(false)
                } finally {
                  setBusy(false)
                }
              }}
            >
              {busy && <Loader2 className="size-3.5 animate-spin" />}
              {confirmLabel}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

/* ---------- Formatting ---------- */

const dt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
export const fmtDateTime = (v?: string | Date | null) => (v ? dt.format(new Date(v)) : "—")

/** "Chrome on Windows" style summary of a user agent string. */
export function deviceOf(ua?: string | null) {
  if (!ua) return "Unknown device"
  const browser = /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : /node|undici/i.test(ua) ? "Script" : "Browser"
  const os = /Windows/.test(ua) ? "Windows" : /Mac OS X/.test(ua) ? "macOS" : /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua) ? "iOS" : /Linux/.test(ua) ? "Linux" : ""
  return os ? `${browser} on ${os}` : browser
}

export const REASONS: Record<string, string> = {
  success: "Signed in",
  password_ok_mfa_required: "Password OK, MFA requested",
  invalid_credentials: "Wrong password",
  unknown_account: "Unknown account",
  inactive: "Account deactivated",
  locked_out: "Locked out",
}
