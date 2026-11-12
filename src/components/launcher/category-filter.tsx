"use client"

import { Boxes, Building2, Sparkles, ShieldCheck, Users, Wallet, Wrench, TrendingUp } from "lucide-react"
import { appCategorySchema, type AppCategory } from "@/lib/schemas/app"
import { cn } from "@/lib/utils"

export type CategoryFilterValue = "All" | AppCategory

const categories: CategoryFilterValue[] = ["All", ...appCategorySchema.options]

const icons: Record<CategoryFilterValue, typeof Boxes> = {
  All: Boxes,
  Growth: TrendingUp,
  Operations: Wrench,
  People: Users,
  Finance: Wallet,
  Platform: ShieldCheck,
  AI: Sparkles,
  Solutions: Building2,
}

type Props = {
  value: CategoryFilterValue
  onChange: (v: CategoryFilterValue) => void
  counts: Record<CategoryFilterValue, number>
}

/** Category pills mirroring the evoq.one product-menu groupings (Growth, Operations, People, Finance, Platform, AI). */
export function CategoryFilter({ value, onChange, counts }: Props) {
  return (
    <div role="group" aria-label="Filter by category" className="flex items-center gap-2 overflow-x-auto border-b px-5 py-3">
      {categories.map((c) => {
        const Icon = icons[c]
        const active = value === c
        return (
          <button
            key={c}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(c)}
            className={cn(
              "label-mono focus-visible:ring-ring/60 inline-flex h-8 shrink-0 items-center gap-1.5 border px-3 text-[10px] transition-colors outline-none focus-visible:ring-3",
              active
                ? "bg-primary border-primary text-primary-foreground"
                : "bg-surface text-muted-foreground hover:text-foreground border-border",
            )}
          >
            <Icon className="size-3.5" />
            {c}
            <span className={cn("ml-0.5 tabular-nums", active ? "text-primary-foreground/70" : "text-muted-foreground/70")}>
              {counts[c] ?? 0}
            </span>
          </button>
        )
      })}
    </div>
  )
}
