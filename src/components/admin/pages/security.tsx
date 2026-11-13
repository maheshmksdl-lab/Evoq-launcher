"use client"

import { Fragment, useState } from "react"
import { adminFetch, Badge, btn, deviceOf, ErrorNote, Field, fmtDateTime, inputClass, Loading, PageHeader, Panel, REASONS, Table, td, useAdminMutation, useAdminQuery } from "../ui"

/* ---------- Sessions ---------- */

type SessionRow = { id: string; name: string; email: string; createdAt: string; updatedAt: string; ipAddress: string | null; userAgent: string | null; current?: boolean }

function SessionTable({ rows, realm }: { rows: SessionRow[]; realm: "user" | "admin" }) {
  const revoke = useAdminMutation((id: string) => adminFetch(`/admin/api/sessions?realm=${realm}&id=${encodeURIComponent(id)}`, { method: "DELETE" }), {
    success: "Session revoked",
    invalidate: [["admin", "sessions"], ["admin", "dashboard"]],
  })
  return (
    <Table head={["Account", "Device", "IP address", "Signed in", "Last active", ""]} empty={rows.length === 0}>
      {rows.map((s) => (
        <tr key={s.id}>
          <td className={td}>
            <p className="font-medium">{s.name} {s.current && <span className="text-muted-foreground text-xs">(this session)</span>}</p>
            <p className="text-muted-foreground text-xs">{s.email}</p>
          </td>
          <td className={td}>{deviceOf(s.userAgent)}</td>
          <td className={`${td} text-muted-foreground text-xs`}>{s.ipAddress ?? "Unknown"}</td>
          <td className={`${td} text-muted-foreground text-xs`}>{fmtDateTime(s.createdAt)}</td>
          <td className={`${td} text-muted-foreground text-xs`}>{fmtDateTime(s.updatedAt)}</td>
          <td className={`${td} text-right`}>
            {!s.current && (
              <button type="button" className={btn.ghost} onClick={() => revoke.mutate(s.id)}>Revoke</button>
            )}
          </td>
        </tr>
      ))}
    </Table>
  )
}

export function SessionsPage() {
  const { data, error, isPending } = useAdminQuery<{ users: SessionRow[]; admins: SessionRow[] | null }>(["admin", "sessions"], "/admin/api/sessions")
  if (isPending) return <Loading />
  if (!data) return <ErrorNote error={error} />
  return (
    <>
      <PageHeader title="Sessions" description="Everyone currently signed in. Revoking signs that device out immediately." />
      <h2 className="label-mono text-muted-foreground mb-2 text-[10px]">User sessions ({data.users.length})</h2>
      <SessionTable rows={data.users} realm="user" />
      {data.admins && (
        <>
          <h2 className="label-mono text-muted-foreground mt-8 mb-2 text-[10px]">Admin sessions ({data.admins.length})</h2>
          <SessionTable rows={data.admins} realm="admin" />
        </>
      )}
    </>
  )
}

/* ---------- Login activity ---------- */

type LoginRow = { id: string; realm: string; email: string; success: boolean; reason: string | null; ipAddress: string | null; userAgent: string | null; createdAt: string }

export function LoginsPage() {
  const [realm, setRealm] = useState("all")
  const [result, setResult] = useState("all")
  const { data, error, isPending } = useAdminQuery<{ events: LoginRow[] }>(["admin", "logins", realm, result], `/admin/api/logins?realm=${realm}&result=${result}`)
  return (
    <>
      <PageHeader
        title="Login activity"
        description="Every sign-in attempt to the launcher and the Admin Portal."
        actions={
          <>
            <select aria-label="Portal" className={`${inputClass} w-36`} value={realm} onChange={(e) => setRealm(e.target.value)}>
              <option value="all">Both portals</option>
              <option value="user">Launcher</option>
              <option value="admin">Admin Portal</option>
            </select>
            <select aria-label="Result" className={`${inputClass} w-36`} value={result} onChange={(e) => setResult(e.target.value)}>
              <option value="all">All results</option>
              <option value="success">Successful</option>
              <option value="failed">Failed</option>
            </select>
          </>
        }
      />
      {isPending ? (
        <Loading />
      ) : !data ? (
        <ErrorNote error={error} />
      ) : (
        <Table head={["When", "Account", "Portal", "Result", "Device", "IP address"]} empty={data.events.length === 0}>
          {data.events.map((e) => (
            <tr key={e.id}>
              <td className={`${td} text-muted-foreground text-xs whitespace-nowrap`}>{fmtDateTime(e.createdAt)}</td>
              <td className={td}>{e.email}</td>
              <td className={td}>{e.realm === "admin" ? <Badge tone="brand">Admin</Badge> : <Badge>Launcher</Badge>}</td>
              <td className={td}>
                <span className="flex items-center gap-2">
                  {e.success ? <Badge tone="good">Success</Badge> : <Badge tone="bad">Failed</Badge>}
                  <span className="text-muted-foreground text-xs">{REASONS[e.reason ?? ""] ?? e.reason}</span>
                </span>
              </td>
              <td className={`${td} text-xs`}>{deviceOf(e.userAgent)}</td>
              <td className={`${td} text-muted-foreground text-xs`}>{e.ipAddress ?? "Unknown"}</td>
            </tr>
          ))}
        </Table>
      )}
    </>
  )
}

/* ---------- Audit log ---------- */

type AuditRow = { id: string; actorEmail: string; action: string; targetType: string; targetId: string | null; before: unknown; after: unknown; ipAddress: string | null; createdAt: string }

export function AuditPage() {
  const [q, setQ] = useState("")
  const [open, setOpen] = useState<string | null>(null)
  const { data, error, isPending } = useAdminQuery<{ entries: AuditRow[] }>(["admin", "audit", q.trim()], `/admin/api/audit${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`)
  return (
    <>
      <PageHeader
        title="Audit log"
        description="Every administrative action. Entries can't be edited or deleted."
        actions={<input aria-label="Filter audit log" placeholder="Filter by action or admin" className={`${inputClass} w-64`} value={q} onChange={(e) => setQ(e.target.value)} />}
      />
      {isPending ? (
        <Loading />
      ) : !data ? (
        <ErrorNote error={error} />
      ) : (
        <Table head={["When", "Admin", "Action", "Target", ""]} empty={data.entries.length === 0}>
          {data.entries.map((e) => (
            <Fragment key={e.id}>
              <tr>
                <td className={`${td} text-muted-foreground text-xs whitespace-nowrap`}>{fmtDateTime(e.createdAt)}</td>
                <td className={td}>{e.actorEmail}</td>
                <td className={`${td} font-mono text-xs`}>{e.action}</td>
                <td className={`${td} text-muted-foreground text-xs`}>
                  {e.targetType}
                  {e.targetId ? ` · ${e.targetId.slice(0, 10)}` : ""}
                </td>
                <td className={`${td} text-right`}>
                  {(e.before != null || e.after != null) && (
                    <button type="button" className={btn.ghost} onClick={() => setOpen(open === e.id ? null : e.id)}>
                      {open === e.id ? "Hide" : "Details"}
                    </button>
                  )}
                </td>
              </tr>
              {open === e.id && (
                <tr>
                  <td colSpan={5} className="bg-muted/40 border-b px-3 py-3">
                    <div className="grid gap-3 text-xs md:grid-cols-2">
                      <div>
                        <p className="label-mono text-muted-foreground mb-1 text-[10px]">Before</p>
                        <pre className="overflow-x-auto whitespace-pre-wrap">{JSON.stringify(e.before, null, 2)}</pre>
                      </div>
                      <div>
                        <p className="label-mono text-muted-foreground mb-1 text-[10px]">After</p>
                        <pre className="overflow-x-auto whitespace-pre-wrap">{JSON.stringify(e.after, null, 2)}</pre>
                      </div>
                    </div>
                    <p className="text-muted-foreground mt-2 text-xs">IP address: {e.ipAddress ?? "Unknown"}</p>
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </Table>
      )}
    </>
  )
}

/* ---------- Security & general settings ---------- */

type Settings = {
  security: { lockoutThreshold: number; lockoutMinutes: number; requireUserMfa: boolean }
  general: { companyName: string; supportEmail: string; maintenanceBanner: string }
  policy: { user: { idleSeconds: number; absoluteSeconds: number }; admin: { idleSeconds: number; absoluteSeconds: number }; minPasswordLength: number }
}

const hours = (s: number) => (s >= 86400 ? `${s / 86400} days` : s >= 3600 ? `${s / 3600} hours` : `${s / 60} minutes`)

function useSettings() {
  const q = useAdminQuery<Settings>(["admin", "settings"], "/admin/api/settings")
  const save = useAdminMutation((body: Partial<Pick<Settings, "security" | "general">>) => adminFetch("/admin/api/settings", { method: "PUT", body }), {
    success: "Settings saved",
    invalidate: [["admin", "settings"]],
  })
  return { ...q, save }
}

type Save = ReturnType<typeof useSettings>["save"]

export function SecuritySettingsPage() {
  const { data, error, isPending, dataUpdatedAt, save } = useSettings()
  if (isPending) return <Loading />
  if (!data) return <ErrorNote error={error} />
  return <SecurityForm key={dataUpdatedAt} initial={data.security} policy={data.policy} save={save} />
}

function SecurityForm({ initial, policy: p, save }: { initial: Settings["security"]; policy: Settings["policy"]; save: Save }) {
  const [form, setForm] = useState(initial)
  return (
    <>
      <PageHeader title="Security" description="Sign-in protection for the launcher and the Admin Portal." />
      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Account lockout and two-factor">
          <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); save.mutate({ security: form }) }}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Failed attempts before lockout" htmlFor="s-thr" hint="Between 3 and 20.">
                <input id="s-thr" type="number" min={3} max={20} className={inputClass} value={form.lockoutThreshold} onChange={(e) => setForm({ ...form, lockoutThreshold: Number(e.target.value) })} />
              </Field>
              <Field label="Lockout length (minutes)" htmlFor="s-min">
                <input id="s-min" type="number" min={1} max={1440} className={inputClass} value={form.lockoutMinutes} onChange={(e) => setForm({ ...form, lockoutMinutes: Number(e.target.value) })} />
              </Field>
            </div>
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" className="mt-0.5 accent-[var(--primary)]" checked={form.requireUserMfa} onChange={(e) => setForm({ ...form, requireUserMfa: e.target.checked })} />
              <span>
                <span className="font-medium">Require two-factor for all users</span>
                <span className="text-muted-foreground block text-xs">Users without it are sent to set it up before using the launcher. Admins always need two-factor.</span>
              </span>
            </label>
            <button type="submit" className={`${btn.primary} self-start`} disabled={save.isPending}>Save security settings</button>
          </form>
        </Panel>
        <Panel title="Session and password policy">
          <dl className="grid grid-cols-[1fr_auto] gap-x-6 gap-y-2 text-sm">
            <dt className="text-muted-foreground">User inactivity timeout</dt><dd>{hours(p.user.idleSeconds)}</dd>
            <dt className="text-muted-foreground">User maximum session</dt><dd>{hours(p.user.absoluteSeconds)}</dd>
            <dt className="text-muted-foreground">Admin inactivity timeout</dt><dd>{hours(p.admin.idleSeconds)}</dd>
            <dt className="text-muted-foreground">Admin maximum session</dt><dd>{hours(p.admin.absoluteSeconds)}</dd>
            <dt className="text-muted-foreground">Minimum password length</dt><dd>{p.minPasswordLength} characters</dd>
            <dt className="text-muted-foreground">Password storage</dt><dd>scrypt hash, never readable</dd>
          </dl>
          <p className="text-muted-foreground mt-3 text-xs">These are set in the deployment configuration.</p>
        </Panel>
      </div>
    </>
  )
}

export function GeneralSettingsPage() {
  const { data, error, isPending, dataUpdatedAt, save } = useSettings()
  if (isPending) return <Loading />
  if (!data) return <ErrorNote error={error} />
  return <GeneralForm key={dataUpdatedAt} initial={data.general} save={save} />
}

function GeneralForm({ initial, save }: { initial: Settings["general"]; save: Save }) {
  const [form, setForm] = useState(initial)
  return (
    <>
      <PageHeader title="Settings" description="General settings for the launcher." />
      <Panel title="General" className="max-w-2xl">
        <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); save.mutate({ general: form }) }}>
          <Field label="Company name" htmlFor="g-name">
            <input id="g-name" className={inputClass} value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} required />
          </Field>
          <Field label="Support email" htmlFor="g-mail" hint="Shown to users who need help.">
            <input id="g-mail" type="email" className={inputClass} value={form.supportEmail} onChange={(e) => setForm({ ...form, supportEmail: e.target.value })} />
          </Field>
          <Field label="Maintenance banner" htmlFor="g-banner" hint="Shown at the top of the launcher when set. Leave empty to hide.">
            <input id="g-banner" className={inputClass} maxLength={200} value={form.maintenanceBanner} onChange={(e) => setForm({ ...form, maintenanceBanner: e.target.value })} />
          </Field>
          <button type="submit" className={`${btn.primary} self-start`} disabled={save.isPending}>Save settings</button>
        </form>
      </Panel>
    </>
  )
}
