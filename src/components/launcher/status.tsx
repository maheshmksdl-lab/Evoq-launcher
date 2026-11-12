import type { InstallStatus, LauncherApp } from "@/lib/schemas/app"
import { cn } from "@/lib/utils"

const statusStyle: Record<InstallStatus, { label: string; className: string }> = {
  available: {
    label: "Available to Launch",
    className: "border-evoq-tint bg-evoq-soft text-evoq-interactive dark:border-evoq-mid/60 dark:bg-evoq-indigo/30 dark:text-evoq-tint",
  },
  installed: {
    label: "Installed",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
  },
  update: {
    label: "Update available",
    className: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
  },
  "coming-soon": {
    label: "Coming soon",
    className: "border-border bg-muted text-muted-foreground",
  },
}

export function StatusChip({ status, className }: { status: InstallStatus; className?: string }) {
  const s = statusStyle[status]
  return (
    <span className={cn("label-mono inline-flex h-5 items-center border px-1.5 text-[10px] leading-none", s.className, className)}>
      {s.label}
    </span>
  )
}

/** Product icon tile: the product's own colour ramp with its white glyph. */
export function AppIcon({ app, size = 56 }: { app: LauncherApp; size?: number }) {
  return (
    <span
      aria-hidden
      className="relative flex shrink-0 items-center justify-center overflow-hidden rounded-md shadow-[inset_0_1px_0_rgb(255_255_255/0.25),0_6px_14px_-8px_var(--tile)]"
      style={{
        width: size,
        height: size,
        ["--tile" as string]: app.color.primary,
        background: `linear-gradient(145deg, ${app.color.primary} 0%, ${app.color.depth} 120%)`,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={app.icon} alt="" width={size * 0.5} height={size * 0.5} className="object-contain" />
    </span>
  )
}

export function AgentTag({ app }: { app: LauncherApp }) {
  if (!app.agent) return null
  return (
    <span className="text-muted-foreground inline-flex min-w-0 items-center gap-1.5 text-xs">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={app.agent.avatar}
        alt=""
        width={20}
        height={20}
        className="ring-background size-5 shrink-0 rounded-full object-cover ring-2"
      />
      <span className="truncate">
        <span className="text-foreground font-medium">{app.agent.name}</span> · {app.agent.role}
      </span>
    </span>
  )
}

const dateFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })
export const formatDate = (iso: string) => dateFmt.format(new Date(`${iso}T00:00:00Z`))
