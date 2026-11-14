"use client"

import type { LauncherApp } from "@/lib/schemas/app"
import { cn } from "@/lib/utils"
import { AppActions } from "./app-actions"
import { AgentTag, AppIcon, formatDate, StatusChip } from "./status"

type Props = { app: LauncherApp; selected: boolean; onSelect: () => void }

export const rowGrid =
  "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 md:grid-cols-[minmax(0,2.4fr)_minmax(0,1fr)_88px_120px_minmax(0,1.3fr)_auto]"

/** List-view row: same data as the card, laid out as a table line. */
export function AppRow({ app, selected, onSelect }: Props) {
  return (
    <div
      role="row"
      aria-current={selected || undefined}
      onClick={onSelect}
      className={cn(
        rowGrid,
        "relative border-b py-3 transition-colors",
        selected ? "bg-selected shadow-[inset_2px_0_0_var(--selected-line)]" : "hover:bg-surface",
      )}
    >
      <div role="cell" className="flex min-w-0 items-center gap-3">
        <AppIcon app={app} size={40} />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onSelect()
              }}
              className="font-heading hover:text-evoq-interactive focus-visible:ring-ring/60 truncate text-base font-bold tracking-tight outline-none focus-visible:ring-3"
            >
              {app.name}
            </button>
            <StatusChip status={app.status} className="hidden sm:inline-flex" />
          </div>
          <p className="text-muted-foreground truncate text-xs">{app.description}</p>
        </div>
      </div>
      <span role="cell" className="text-muted-foreground hidden text-sm md:block">{app.category}</span>
      <span role="cell" className="label-mono text-muted-foreground hidden md:block">V{app.version}</span>
      <span role="cell" className="text-muted-foreground hidden text-sm md:block">{formatDate(app.updatedAt)}</span>
      <span role="cell" className="hidden min-w-0 md:block">
        <AgentTag app={app} />
      </span>
      <div role="cell">
        <AppActions app={app} compact onDetails={onSelect} />
      </div>
    </div>
  )
}
