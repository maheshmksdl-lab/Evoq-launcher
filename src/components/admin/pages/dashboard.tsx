"use client"

import { useState } from "react"
import Link from "next/link"
import { useCan } from "../admin-shell"
import { ErrorNote, fmtDateTime, Loading, PageHeader, Panel, StatTile, useAdminQuery } from "../ui"

type Dashboard = {
  stats: {
    totalUsers: number
    activeUsers: number
    inactiveUsers: number
    mfaUsers: number
    admins: number
    activeSessions: number
    signInsToday: number
    failedSignIns24h: number
    pendingRequests: number
  }
  signIns: { day: string; success: number; failed: number }[]
  usersPerApp: { appId: string; name: string; users: number }[]
  recent: { id: string; actorEmail: string; action: string; targetType: string; targetId: string | null; createdAt: string }[]
}

const dayLabel = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" })

/** Successful sign-ins per day: one series, one hue (--chart-1), crosshair-free per-bar tooltip. */
function SignInsChart({ data }: { data: Dashboard["signIns"] }) {
  const [hover, setHover] = useState<number | null>(null)
  const W = 600
  const H = 180
  const pad = { top: 12, right: 8, bottom: 22, left: 28 }
  const max = Math.max(4, ...data.map((d) => d.success))
  const nice = Math.ceil(max / 4) * 4
  const slot = (W - pad.left - pad.right) / data.length
  const barW = Math.max(2, slot - 2) // 2px surface gap between bars
  const y = (v: number) => pad.top + (H - pad.top - pad.bottom) * (1 - v / nice)
  const h = hover !== null ? data[hover] : null

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Successful sign-ins per day, last 30 days">
        {[0, 0.5, 1].map((t) => (
          <g key={t}>
            <line x1={pad.left} x2={W - pad.right} y1={y(nice * t)} y2={y(nice * t)} stroke="var(--border)" strokeWidth={1} />
            <text x={pad.left - 6} y={y(nice * t) + 3} textAnchor="end" className="fill-muted-foreground text-[9px]">
              {nice * t}
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          const x = pad.left + i * slot + 1
          const top = y(d.success)
          const bh = Math.max(0, H - pad.bottom - top)
          const r = Math.min(4, barW / 2, bh)
          return (
            <g key={d.day} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              {/* hit target taller than the mark */}
              <rect x={x - 1} y={pad.top} width={slot} height={H - pad.top - pad.bottom} fill="transparent" />
              {bh > 0 && (
                <path
                  d={`M${x},${H - pad.bottom} V${top + r} Q${x},${top} ${x + r},${top} H${x + barW - r} Q${x + barW},${top} ${x + barW},${top + r} V${H - pad.bottom} Z`}
                  fill="var(--chart-1)"
                  opacity={hover === null || hover === i ? 1 : 0.45}
                />
              )}
            </g>
          )
        })}
        <line x1={pad.left} x2={W - pad.right} y1={H - pad.bottom} y2={H - pad.bottom} stroke="var(--muted-foreground)" strokeOpacity={0.4} />
        {[0, 14, 29].map((i) => (
          <text key={i} x={pad.left + i * slot + slot / 2} y={H - 6} textAnchor={i === 0 ? "start" : i === 29 ? "end" : "middle"} className="fill-muted-foreground text-[9px]">
            {data[i] ? dayLabel(data[i].day) : ""}
          </text>
        ))}
      </svg>
      {h && hover !== null && (
        <div
          className="bg-popover pointer-events-none absolute top-0 z-10 border px-2.5 py-1.5 text-xs shadow-sm"
          style={{ left: `${Math.min(80, Math.max(0, ((hover + 0.5) / data.length) * 100 - 10))}%` }}
        >
          <p className="font-medium">{dayLabel(h.day)}</p>
          <p>
            {h.success} successful · <span className="text-muted-foreground">{h.failed} failed</span>
          </p>
        </div>
      )}
      <details className="mt-2 text-xs">
        <summary className="text-muted-foreground cursor-pointer">Show as table</summary>
        <table className="mt-2 w-full max-w-sm text-left">
          <thead>
            <tr className="text-muted-foreground">
              <th className="py-1 font-normal">Day</th>
              <th className="py-1 font-normal">Successful</th>
              <th className="py-1 font-normal">Failed</th>
            </tr>
          </thead>
          <tbody>
            {data.filter((d) => d.success || d.failed).map((d) => (
              <tr key={d.day}>
                <td className="py-0.5">{dayLabel(d.day)}</td>
                <td className="py-0.5 tabular-nums">{d.success}</td>
                <td className="py-0.5 tabular-nums">{d.failed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  )
}

/** Users with access per app: horizontal bars, one hue, value in text ink beside each bar. */
function UsersPerApp({ data }: { data: Dashboard["usersPerApp"] }) {
  if (!data.length) return <p className="text-muted-foreground text-sm">No app access granted yet.</p>
  const max = Math.max(...data.map((d) => d.users))
  return (
    <ul className="flex flex-col gap-2.5" aria-label="Users with access per app">
      {data.map((d) => (
        <li key={d.appId} className="grid grid-cols-[110px_1fr_32px] items-center gap-3 text-sm" title={`${d.name}: ${d.users} users`}>
          <span className="truncate">{d.name}</span>
          <span className="bg-muted h-3">
            <span className="block h-full rounded-r-[4px]" style={{ width: `${(d.users / max) * 100}%`, background: "var(--chart-1)" }} />
          </span>
          <span className="text-muted-foreground text-right tabular-nums">{d.users}</span>
        </li>
      ))}
    </ul>
  )
}

export function DashboardPage() {
  const can = useCan()
  const { data, error, isPending } = useAdminQuery<Dashboard>(["admin", "dashboard"], "/admin/api/dashboard")
  if (isPending) return <Loading />
  if (!data) return <ErrorNote error={error} />
  const s = data.stats

  return (
    <>
      <PageHeader title="Dashboard" description="Users, access and sign-in activity across the EVOQ Launcher." />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatTile label="Total users" value={s.totalUsers} hint={`${s.mfaUsers} with two-factor`} />
        <StatTile label="Active" value={s.activeUsers} />
        <StatTile label="Inactive" value={s.inactiveUsers} />
        <StatTile label="Active sessions" value={s.activeSessions} />
        <StatTile label="Sign-ins today" value={s.signInsToday} />
        <StatTile label="Failed (24h)" value={s.failedSignIns24h} tone="warn" />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatTile label="Administrators" value={s.admins} />
        <div className="bg-surface border px-4 py-3">
          <p className="label-mono text-muted-foreground text-[10px]">Pending requests</p>
          <p className="font-heading mt-1 text-3xl font-bold tabular-nums">{s.pendingRequests}</p>
          {can("access.manage") && s.pendingRequests > 0 && (
            <Link href="/admin/requests" className="text-evoq-interactive dark:text-evoq-bright text-xs hover:underline">
              Review requests
            </Link>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Panel title="Successful sign-ins · last 30 days">
          <SignInsChart data={data.signIns} />
        </Panel>
        <Panel title="Users per app">
          <UsersPerApp data={data.usersPerApp} />
        </Panel>
      </div>

      {can("logs.view") && (
        <Panel
          title="Recent admin actions"
          className="mt-4"
          actions={
            <Link href="/admin/audit" className="text-evoq-interactive dark:text-evoq-bright text-xs hover:underline">
              Full audit log
            </Link>
          }
        >
          {data.recent.length === 0 ? (
            <p className="text-muted-foreground text-sm">No actions yet.</p>
          ) : (
            <ul className="divide-y text-sm">
              {data.recent.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <span>
                    <span className="font-medium">{r.actorEmail}</span> <span className="text-muted-foreground">·</span> <span className="font-mono text-xs">{r.action}</span>
                  </span>
                  <span className="text-muted-foreground text-xs">{fmtDateTime(r.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      )}
    </>
  )
}
