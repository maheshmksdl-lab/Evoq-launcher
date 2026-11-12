"use client"

import { ArrowUpRight } from "lucide-react"
import type { LauncherApp } from "@/lib/schemas/app"
import { cn } from "@/lib/utils"
import { AppActions } from "./app-actions"
import { AgentTag, AppIcon, formatDate, StatusChip } from "./status"

type Props = { app: LauncherApp; selected: boolean; onSelect: () => void }

/** One cell of the launcher grid. Cells share hairlines, like a spec sheet. */
export function AppCard({ app, selected, onSelect }: Props) {
  return (
    <article
      aria-label={app.name}
      aria-current={selected || undefined}
      onClick={onSelect}
      className={cn(
        "group/card relative flex flex-col border-r border-b transition-colors",
        selected ? "bg-selected" : "hover:bg-surface",
      )}
    >
      {/* Selection rule along the top edge */}
      <span
        aria-hidden
        className={cn(
          "bg-selected-line absolute inset-x-0 -top-px h-0.5 origin-left transition-transform duration-300",
          selected ? "scale-x-100" : "scale-x-0",
        )}
      />

      <header className="flex h-10 items-center justify-between border-b px-5">
        <span className={cn("label-mono", selected ? "text-evoq-interactive dark:text-evoq-bright" : "text-muted-foreground")}>
          V{app.version}
        </span>
        <a
          href={app.productUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="label-mono text-muted-foreground hover:text-evoq-interactive inline-flex items-center gap-1 transition-colors"
        >
          Product page <ArrowUpRight className="size-3" />
        </a>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-start gap-3.5">
          <AppIcon app={app} />
          <div className="min-w-0 pt-0.5">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h2 className="font-heading text-[22px] leading-tight font-bold tracking-tight">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onSelect()
                  }}
                  className="text-evoq-charcoal dark:text-foreground hover:text-evoq-interactive focus-visible:ring-ring/60 text-left outline-none focus-visible:ring-3"
                >
                  {app.name}
                </button>
              </h2>
              <span className="label-mono border-evoq-tint text-evoq-interactive dark:border-evoq-mid dark:text-evoq-tint border px-1.5 py-0.5 text-[9px] leading-none">
                By EVOQ
              </span>
            </div>
            <p className="text-muted-foreground mt-1 truncate text-sm">{app.tagline}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <StatusChip status={app.status} />
          <AgentTag app={app} />
        </div>

        <dl className="text-evoq-body dark:text-muted-foreground flex flex-1 flex-col gap-1.5 text-[13px] leading-relaxed">
          <div className="flex gap-1">
            <dt>Download size:</dt>
            <dd className="text-foreground/80">{app.sizeMb} MB</dd>
          </div>
          <dd className="text-foreground/80 line-clamp-2">{app.description}</dd>
          <div className="text-evoq-subtle dark:text-muted-foreground/80 mt-auto flex gap-1">
            <dt>Last updated:</dt>
            <dd>{formatDate(app.updatedAt)}</dd>
          </div>
        </dl>

        <AppActions app={app} onDetails={onSelect} />
      </div>
    </article>
  )
}
