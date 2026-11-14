"use client"

import { Boxes, Sparkles, ShieldCheck, Users, Wallet, Wrench, TrendingUp } from "lucide-react"
import type { IndustryFilter } from "@/lib/industries"
import { appCategorySchema, type AppCategory } from "@/lib/schemas/app"
import { cn } from "@/lib/utils"
import { SolutionsMenu } from "./solutions-menu"

export type CategoryFilterValue = "All" | Exclude<AppCategory, "Solutions">

const categories: CategoryFilterValue[] = [
  "All",
  ...appCategorySchema.options.filter((category): category is Exclude<AppCategory, "Solutions"> => category !== "Solutions"),
]

const icons: Record<CategoryFilterValue, typeof Boxes> = {
  All: Boxes,
  Growth: TrendingUp,
  Operations: Wrench,
  People: Users,
  Finance: Wallet,
  Platform: ShieldCheck,
  AI: Sparkles,
}

type Props = {
  value: CategoryFilterValue
  onChange: (v: CategoryFilterValue) => void
  counts: Record<CategoryFilterValue, number>
  industry: IndustryFilter | null
  onIndustryChange: (value: IndustryFilter) => void
  industryCounts: Record<IndustryFilter, number>
}

/** Category pills and the industry filter share the row without clearing each other. */
export function CategoryFilter({ value, onChange, counts, industry, onIndustryChange, industryCounts }: Props) {
  return (
    <div className="flex flex-col gap-3 border-b px-5 py-3 lg:flex-row lg:items-end lg:gap-6">
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span id="filter-category-label" className="label-mono text-muted-foreground text-[10px]">
          Filter by Category
        </span>
        <div role="group" aria-labelledby="filter-category-label" className="flex items-center gap-2 overflow-x-auto">
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
      </div>
      <div className="flex shrink-0 self-end flex-col items-start gap-1.5 lg:self-auto">
        <span className="label-mono text-muted-foreground text-[10px]">Filter by Industry Solutions</span>
        <SolutionsMenu value={industry} onChange={onIndustryChange} counts={industryCounts} />
      </div>
    </div>
  )
}
