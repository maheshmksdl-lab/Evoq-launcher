"use client"

import { useState } from "react"
import { useCan } from "../admin-shell"
import { adminFetch, Badge, btn, ErrorNote, fmtDateTime, inputClass, Loading, PageHeader, Table, td, useAdminMutation, useAdminQuery } from "../ui"
import type { AdminApp } from "./users"

const STATUS_LABEL: Record<string, string> = { installed: "Subscribed", update: "Update available", available: "Not subscribed", "coming-soon": "Coming soon" }

/* ---------- Applications & subscriptions ---------- */

type AppRow = AdminApp & { url: string | null; defaultUrl: string; category: string }

function UrlEditor({ app, onSave }: { app: AppRow; onSave: (url: string) => void }) {
  const [url, setUrl] = useState(app.url ?? "")
  const dirty = url !== (app.url ?? "")
  return (
    <div className="flex items-center gap-2">
      <input aria-label={`${app.name} address`} className={`${inputClass} min-w-[220px]`} placeholder={app.defaultUrl} value={url} onChange={(e) => setUrl(e.target.value)} />
      {dirty && (
        <button type="button" className={btn.ghost} onClick={() => onSave(url)}>
          Save
        </button>
      )}
    </div>
  )
}

export function ApplicationsPage() {
  const { data, error, isPending } = useAdminQuery<{ apps: AppRow[] }>(["admin", "apps"], "/admin/api/apps")
  const patch = useAdminMutation((body: { appId: string; status?: string; enabled?: boolean; url?: string }) => adminFetch("/admin/api/apps", { method: "PATCH", body }), {
    success: "Application updated",
    invalidate: [["admin", "apps"], ["apps"]],
  })

  return (
    <>
      <PageHeader title="Applications" description="Your organisation's subscription for each app, whether it's shown in the launcher, and its address." />
      {isPending ? (
        <Loading />
      ) : !data ? (
        <ErrorNote error={error} />
      ) : (
        <Table head={["App", "Subscription", "Shown", "Users", "Address (leave empty for default)"]}>
          {data.apps.map((a) => (
            <tr key={a.id}>
              <td className={td}>
                <span className="flex items-center gap-2.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={a.icon} alt="" width={28} height={28} className="size-7" />
                  <span>
                    <span className="block font-medium">{a.name}</span>
                    <span className="text-muted-foreground text-xs">{a.category}</span>
                  </span>
                </span>
              </td>
              <td className={td}>
                <select aria-label={`${a.name} subscription`} className={`${inputClass} w-44`} value={a.status} onChange={(e) => patch.mutate({ appId: a.id, status: e.target.value })}>
                  {Object.entries(STATUS_LABEL).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </td>
              <td className={td}>
                <input type="checkbox" aria-label={`Show ${a.name} in the launcher`} className="accent-[var(--primary)]" checked={a.enabled} onChange={(e) => patch.mutate({ appId: a.id, enabled: e.target.checked })} />
              </td>
              <td className={`${td} tabular-nums`}>{a.users}</td>
              <td className={td}>
                <UrlEditor key={a.url ?? ""} app={a} onSave={(url) => patch.mutate({ appId: a.id, url })} />
              </td>
            </tr>
          ))}
        </Table>
      )}
    </>
  )
}

/* ---------- Access matrix ---------- */

type UserRow = { id: string; name: string; email: string; status: string; apps: string[] }

export function AccessPage() {
  const users = useAdminQuery<{ users: UserRow[] }>(["admin", "users", "all", ""], "/admin/api/users?status=all")
  const apps = useAdminQuery<{ apps: AppRow[] }>(["admin", "apps"], "/admin/api/apps")
  const save = useAdminMutation(({ id, list }: { id: string; list: string[] }) => adminFetch(`/admin/api/users/${id}/access`, { method: "PUT", body: { apps: list } }), {
    success: "Access saved",
    invalidate: [["admin", "users"], ["admin", "apps"], ["admin", "dashboard"]],
  })

  if (users.isPending || apps.isPending) return <Loading />
  if (!users.data || !apps.data) return <ErrorNote error={users.error ?? apps.error} />
  return <AccessMatrix key={users.dataUpdatedAt} users={users.data.users} apps={apps.data.apps} onSave={(id, list) => save.mutate({ id, list })} />
}

function AccessMatrix({ users, apps, onSave }: { users: UserRow[]; apps: AppRow[]; onSave: (id: string, list: string[]) => void }) {
  const [draft, setDraft] = useState<Record<string, string[]>>(() => Object.fromEntries(users.map((u) => [u.id, u.apps])))
  const cols = apps.filter((a) => a.status === "installed" || a.status === "update")

  return (
    <>
      <PageHeader title="App access" description="Which subscribed apps each user can open. Changes save per user." />
      {cols.length === 0 ? (
        <p className="text-muted-foreground text-sm">No apps are subscribed yet. Subscribe on the Applications page first.</p>
      ) : (
        <div className="overflow-x-auto border">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-surface">
              <tr className="border-b">
                <th className="label-mono text-muted-foreground sticky left-0 bg-surface px-3 py-2.5 text-left text-[10px] font-normal">User</th>
                {cols.map((a) => (
                  <th key={a.id} className="label-mono text-muted-foreground px-2 py-2.5 text-center text-[10px] font-normal whitespace-nowrap">{a.name}</th>
                ))}
                <th className="px-3" />
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const current = draft[u.id] ?? []
                const dirty = [...current].sort().join() !== [...u.apps].sort().join()
                return (
                  <tr key={u.id} className="border-b">
                    <td className="bg-surface sticky left-0 px-3 py-2">
                      <p className="font-medium whitespace-nowrap">{u.name}</p>
                      <p className="text-muted-foreground text-xs">{u.status === "active" ? u.email : "Inactive"}</p>
                    </td>
                    {cols.map((a) => (
                      <td key={a.id} className="px-2 py-2 text-center">
                        <input
                          type="checkbox"
                          aria-label={`${u.name} can open ${a.name}`}
                          className="accent-[var(--primary)]"
                          checked={current.includes(a.id)}
                          onChange={(e) => setDraft({ ...draft, [u.id]: e.target.checked ? [...current, a.id] : current.filter((x) => x !== a.id) })}
                        />
                      </td>
                    ))}
                    <td className="px-3 py-2 text-right">
                      {dirty && (
                        <button type="button" className={btn.ghost} onClick={() => onSave(u.id, current)}>Save</button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

/* ---------- Access requests ---------- */

type RequestRow = { id: string; appId: string; appName: string; status: string; createdAt: string; decidedAt: string | null; userName: string; userEmail: string }

export function RequestsPage() {
  const can = useCan()
  const [status, setStatus] = useState("pending")
  const { data, error, isPending } = useAdminQuery<{ requests: RequestRow[] }>(["admin", "requests", status], `/admin/api/requests?status=${status}`)
  const decide = useAdminMutation(({ id, decision }: { id: string; decision: "approve" | "deny" }) => adminFetch(`/admin/api/requests/${id}`, { method: "POST", body: { decision } }), {
    success: (v) => (v.decision === "approve" ? "Access approved" : "Request declined"),
    invalidate: [["admin", "requests"], ["admin", "dashboard"], ["admin", "users"], ["admin", "apps"]],
  })

  return (
    <>
      <PageHeader
        title="Access requests"
        description={can("apps.manage") ? "Approving an app your organisation doesn't subscribe to also subscribes it." : "Requests for unsubscribed apps need an Admin to approve."}
        actions={
          <select aria-label="Filter requests" className={`${inputClass} w-40`} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="denied">Declined</option>
            <option value="all">All</option>
          </select>
        }
      />
      {isPending ? (
        <Loading />
      ) : !data ? (
        <ErrorNote error={error} />
      ) : (
        <Table head={["User", "App", "Requested", "Status", ""]} empty={data.requests.length === 0}>
          {data.requests.map((r) => (
            <tr key={r.id}>
              <td className={td}>
                <p className="font-medium">{r.userName}</p>
                <p className="text-muted-foreground text-xs">{r.userEmail}</p>
              </td>
              <td className={td}>{r.appName}</td>
              <td className={`${td} text-muted-foreground text-xs`}>{fmtDateTime(r.createdAt)}</td>
              <td className={td}>{r.status === "pending" ? <Badge tone="brand">Pending</Badge> : r.status === "approved" ? <Badge tone="good">Approved</Badge> : <Badge>Declined</Badge>}</td>
              <td className={`${td} text-right whitespace-nowrap`}>
                {r.status === "pending" && (
                  <span className="inline-flex gap-2">
                    <button type="button" className={btn.primary} onClick={() => decide.mutate({ id: r.id, decision: "approve" })}>Approve</button>
                    <button type="button" className={btn.secondary} onClick={() => decide.mutate({ id: r.id, decision: "deny" })}>Decline</button>
                  </span>
                )}
              </td>
            </tr>
          ))}
        </Table>
      )}
    </>
  )
}
