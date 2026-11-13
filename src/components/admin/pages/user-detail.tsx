"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { useCan } from "../admin-shell"
import { adminFetch, Badge, btn, Confirm, deviceOf, ErrorNote, Field, fmtDateTime, inputClass, Loading, PageHeader, Panel, REASONS, useAdminMutation, useAdminQuery } from "../ui"
import type { AdminApp } from "./users"

type Detail = {
  user: { id: string; name: string; email: string; title: string | null; phone: string | null; status: string; twoFactorEnabled: boolean; passwordSet: boolean; lastLoginAt: string | null; createdAt: string }
  apps: string[]
  sessions: { id: string; updatedAt: string; createdAt: string; ipAddress: string | null; userAgent: string | null }[]
  logins: { id: string; success: boolean; reason: string | null; ipAddress: string | null; createdAt: string }[]
}

export function UserDetailPage({ id }: { id: string }) {
  const { data, error, isPending, dataUpdatedAt } = useAdminQuery<Detail>(["admin", "user", id], `/admin/api/users/${id}`)
  if (isPending) return <Loading />
  if (!data) return <ErrorNote error={error} />
  return <UserDetail key={dataUpdatedAt} id={id} data={data} />
}

function UserDetail({ id, data }: { id: string; data: Detail }) {
  const can = useCan()
  const router = useRouter()
  const key = ["admin", "user", id]
  const apps = useAdminQuery<{ apps: AdminApp[] }>(["admin", "apps"], "/admin/api/apps")
  const [profile, setProfile] = useState({ name: data.user.name, title: data.user.title ?? "", phone: data.user.phone ?? "" })
  const [granted, setGranted] = useState<string[]>(data.apps)

  const inv = [key, ["admin", "users"], ["admin", "dashboard"]]
  const save = useAdminMutation((body: object) => adminFetch(`/admin/api/users/${id}`, { method: "PATCH", body }), { success: "User updated", invalidate: inv })
  const saveAccess = useAdminMutation((list: string[]) => adminFetch(`/admin/api/users/${id}/access`, { method: "PUT", body: { apps: list } }), { success: "App access saved", invalidate: inv })
  const act = useAdminMutation((action: string) => adminFetch(`/admin/api/users/${id}/actions`, { method: "POST", body: { action } }), {
    success: (a) => ({ "reset-password": "Password link sent", "reset-mfa": "Two-factor reset", "revoke-sessions": "Signed out everywhere" })[a] ?? "Done",
    invalidate: inv,
  })

  const u = data.user
  const editable = can("users.manage")

  return (
    <>
      <Link href="/admin/users" className="text-muted-foreground hover:text-foreground mb-3 inline-flex items-center gap-1 text-sm">
        <ArrowLeft className="size-4" /> Users
      </Link>
      <PageHeader
        title={u.name}
        description={u.email}
        actions={
          <div className="flex items-center gap-2">
            {u.status === "active" ? <Badge tone="good">Active</Badge> : <Badge>Inactive</Badge>}
            {!u.passwordSet && <Badge tone="brand">Invitation pending</Badge>}
            {u.twoFactorEnabled && <Badge tone="good">Two-factor on</Badge>}
          </div>
        }
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Profile">
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault()
              save.mutate({ name: profile.name, title: profile.title || null, phone: profile.phone || null })
            }}
          >
            <Field label="Full name" htmlFor="u-name">
              <input id="u-name" className={inputClass} disabled={!editable} value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} required />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Job title" htmlFor="u-title">
                <input id="u-title" className={inputClass} disabled={!editable} value={profile.title} onChange={(e) => setProfile({ ...profile, title: e.target.value })} />
              </Field>
              <Field label="Phone" htmlFor="u-phone">
                <input id="u-phone" className={inputClass} disabled={!editable} value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
              </Field>
            </div>
            <p className="text-muted-foreground text-xs">Created {fmtDateTime(u.createdAt)} · last sign-in {fmtDateTime(u.lastLoginAt)}</p>
            {editable && (
              <button type="submit" className={`${btn.primary} self-start`} disabled={save.isPending}>
                Save profile
              </button>
            )}
          </form>
        </Panel>

        <Panel title="App access">
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {(apps.data?.apps ?? [])
              .filter((a) => a.status !== "coming-soon")
              .map((a) => (
                <label key={a.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="accent-[var(--primary)]"
                    disabled={!can("access.manage")}
                    checked={granted.includes(a.id)}
                    onChange={(e) => setGranted(e.target.checked ? [...granted, a.id] : granted.filter((x) => x !== a.id))}
                  />
                  {a.name}
                  {a.status === "available" && <span className="text-muted-foreground text-[10px]">(not subscribed)</span>}
                </label>
              ))}
          </div>
          {can("access.manage") && (
            <button type="button" className={`${btn.primary} mt-4`} disabled={saveAccess.isPending} onClick={() => saveAccess.mutate(granted)}>
              Save access
            </button>
          )}
        </Panel>

        <Panel title="Account and security">
          <div className="flex flex-wrap gap-2">
            {editable && (
              <>
                <button type="button" className={btn.secondary} onClick={() => act.mutate("reset-password")}>
                  Send password link
                </button>
                {u.twoFactorEnabled && (
                  <Confirm
                    title="Reset two-factor?"
                    body={`${u.name} will need to set up two-factor again next time they sign in.`}
                    confirmLabel="Reset two-factor"
                    onConfirm={() => act.mutateAsync("reset-mfa")}
                    trigger={(open) => (
                      <button type="button" className={btn.secondary} onClick={open}>
                        Reset two-factor
                      </button>
                    )}
                  />
                )}
                {u.status === "active" ? (
                  <Confirm
                    title="Deactivate this user?"
                    body={`${u.name} will be signed out everywhere and won't be able to sign in until reactivated.`}
                    confirmLabel="Deactivate"
                    danger
                    onConfirm={() => save.mutateAsync({ status: "inactive" })}
                    trigger={(open) => (
                      <button type="button" className={btn.danger} onClick={open}>
                        Deactivate
                      </button>
                    )}
                  />
                ) : (
                  <button type="button" className={btn.primary} onClick={() => save.mutate({ status: "active" })}>
                    Reactivate
                  </button>
                )}
              </>
            )}
            {can("users.delete") && (
              <Confirm
                title="Delete this user permanently?"
                body={`This removes ${u.name}'s account, sessions, app access and requests. It can't be undone. Deactivating is usually the better choice.`}
                confirmLabel="Delete permanently"
                danger
                onConfirm={async () => {
                  await adminFetch(`/admin/api/users/${id}`, { method: "DELETE" })
                  router.replace("/admin/users")
                }}
                trigger={(open) => (
                  <button type="button" className={btn.danger} onClick={open}>
                    Delete user
                  </button>
                )}
              />
            )}
          </div>
        </Panel>

        {can("sessions.manage") && (
          <Panel
            title={`Active sessions (${data.sessions.length})`}
            actions={
              data.sessions.length > 0 && (
                <button type="button" className={btn.ghost} onClick={() => act.mutate("revoke-sessions")}>
                  Sign out everywhere
                </button>
              )
            }
          >
            {data.sessions.length === 0 ? (
              <p className="text-muted-foreground text-sm">Not signed in anywhere.</p>
            ) : (
              <ul className="divide-y text-sm">
                {data.sessions.map((s) => (
                  <li key={s.id} className="py-2">
                    <p className="font-medium">{deviceOf(s.userAgent)}</p>
                    <p className="text-muted-foreground text-xs">
                      {s.ipAddress ?? "Unknown IP"} · active {fmtDateTime(s.updatedAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        )}

        <Panel title="Recent sign-in attempts" className="xl:col-span-2">
          {data.logins.length === 0 ? (
            <p className="text-muted-foreground text-sm">No sign-in attempts yet.</p>
          ) : (
            <ul className="divide-y text-sm">
              {data.logins.map((l) => (
                <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <span className="flex items-center gap-2">
                    {l.success ? <Badge tone="good">Success</Badge> : <Badge tone="bad">Failed</Badge>}
                    {REASONS[l.reason ?? ""] ?? l.reason}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {l.ipAddress ?? "Unknown IP"} · {fmtDateTime(l.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  )
}
