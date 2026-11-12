"use client"

import { useEffect, useState } from "react"
import { Globe, LayoutGrid, List, Moon, RotateCw, Search, Settings, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { sortOptions, sortSchema, type SortKey } from "@/lib/schemas/app"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

const iconBtn =
  "text-muted-foreground hover:text-foreground hover:bg-muted focus-visible:ring-ring/60 inline-flex items-center justify-center transition-colors outline-none focus-visible:ring-3 focus-visible:ring-inset"

/* ---------- Title bar ---------- */

export function TitleBar() {
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <header className="bg-surface flex h-12 shrink-0 items-stretch border-b">
      <div className="flex items-center gap-2.5 pr-6 pl-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/evoq-logo.png" alt="EVOQ" width={98} height={20} className="h-5 w-auto dark:brightness-0 dark:invert" />
      </div>
      <div className="flex items-center border-l pl-4">
        <span className="label-mono text-muted-foreground">App suite</span>
      </div>

      <div className="ml-auto flex items-stretch">
        <Tooltip>
          <TooltipTrigger
            render={<div />}
            className="hidden items-center gap-2 border-l px-4 text-xs sm:flex"
          >
            <span className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/characters/evi.webp" alt="" width={24} height={24} className="ring-evoq-tint size-6 rounded-full object-cover ring-2" />
              <span className="border-surface absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full border-2 bg-emerald-500" />
            </span>
            <span>
              <span className="font-semibold">EVI</span>
              <span className="text-muted-foreground"> · ready</span>
            </span>
          </TooltipTrigger>
          <TooltipContent side="bottom">EVI, the EVOQ AI assistant, works inside every installed app.</TooltipContent>
        </Tooltip>

        <button
          type="button"
          aria-label="Toggle colour theme"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          className={cn(iconBtn, "w-12 border-l")}
        >
          <Sun className="size-4 dark:hidden" />
          <Moon className="hidden size-4 dark:block" />
        </button>
        <a href="https://evoq.one" target="_blank" rel="noopener noreferrer" aria-label="Settings and account on evoq.one" className={cn(iconBtn, "w-12 border-l")}>
          <Settings className="size-4" />
        </a>
      </div>
    </header>
  )
}

/* ---------- Toolbar ---------- */

type ToolbarProps = {
  sort: SortKey
  onSort: (s: SortKey) => void
  search: string
  onSearch: (s: string) => void
  view: "grid" | "list"
  onView: (v: "grid" | "list") => void
  onRefresh: () => void
  refreshing: boolean
}

export function Toolbar({ sort, onSort, search, onSearch, view, onView, onRefresh, refreshing }: ToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 px-5 py-4">
      <button
        type="button"
        aria-label="Check for updates"
        onClick={onRefresh}
        disabled={refreshing}
        className={cn(iconBtn, "bg-surface size-9 border disabled:opacity-70")}
      >
        <RotateCw className={cn("size-4", refreshing && "animate-spin")} />
      </button>

      <div className="ml-auto flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-3">
          <span className="label-mono text-muted-foreground hidden sm:inline">Sort</span>
          <Select
            items={[...sortOptions]}
            value={sort}
            onValueChange={(v) => {
              const parsed = sortSchema.safeParse(v)
              if (parsed.success) onSort(parsed.data)
            }}
          >
            <SelectTrigger aria-label="Sort apps" className="bg-surface h-9! w-48 rounded-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>

        <div className="relative">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <input
            type="search"
            aria-label="Search apps"
            placeholder="Search apps"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            className="bg-surface placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/40 h-9 w-56 border pr-3 pl-9 text-sm outline-none focus-visible:ring-3"
          />
        </div>

        <div role="group" aria-label="View" className="flex">
          {(
            [
              ["grid", LayoutGrid, "Grid view"],
              ["list", List, "List view"],
            ] as const
          ).map(([v, Icon, label]) => (
            <button
              key={v}
              type="button"
              aria-label={label}
              aria-pressed={view === v}
              onClick={() => onView(v)}
              className={cn(
                "focus-visible:ring-ring/60 -ml-px inline-flex size-9 items-center justify-center border transition-colors outline-none first:ml-0 focus-visible:z-10 focus-visible:ring-3",
                view === v
                  ? "bg-primary border-primary text-primary-foreground"
                  : "bg-surface text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ---------- Status bar ---------- */

function useRelativeTime(iso?: string) {
  // Read the clock only on the client (Cache Components forbids it during prerender).
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => {
    const tick = () => setNow(Date.now())
    const first = setTimeout(tick, 0)
    const t = setInterval(tick, 30_000)
    return () => {
      clearTimeout(first)
      clearInterval(t)
    }
  }, [iso])
  if (!iso || now === null) return "just now"
  const mins = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60_000))
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.round(mins / 60)
  return `${hrs} hr${hrs > 1 ? "s" : ""} ago`
}

export function StatusBar({ checkedAt, total, installed, updates }: { checkedAt?: string; total: number; installed: number; updates: number }) {
  const ago = useRelativeTime(checkedAt)
  return (
    <footer className="bg-surface label-mono text-muted-foreground flex h-9 shrink-0 items-center gap-4 border-t px-5 text-[10px]">
      <span className="truncate">
        Checked {ago} · using EVOQ API
      </span>
      <span className="ml-auto hidden items-center gap-3 sm:flex">
        <span>{total} apps</span>
        <span aria-hidden>·</span>
        <span>{installed} installed</span>
        {updates > 0 && (
          <>
            <span aria-hidden>·</span>
            <span className="text-amber-600 dark:text-amber-400">
              {updates} update{updates > 1 ? "s" : ""}
            </span>
          </>
        )}
      </span>
      <a href="https://evoq.one" target="_blank" rel="noopener noreferrer" aria-label="evoq.one" className="hover:text-evoq-interactive transition-colors">
        <Globe className="size-3.5" />
      </a>
    </footer>
  )
}
