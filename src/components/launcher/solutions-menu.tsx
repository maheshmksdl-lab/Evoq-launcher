"use client"

import { Building2, Check, ChevronDown, Factory, HardHat, HeartPulse, Hotel, Landmark, LayoutGrid, Wrench } from "lucide-react"
import { industries, industryLabel, type Industry, type IndustryFilter } from "@/lib/industries"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const icons: Record<Industry, typeof Factory> = {
  healthcare: HeartPulse,
  manufacturing: Factory,
  hospitality: Hotel,
  "field-service": Wrench,
  "financial-services": Landmark,
  construction: HardHat,
}

type Props = {
  value: IndustryFilter | null
  onChange: (value: IndustryFilter) => void
  counts: Record<IndustryFilter, number>
}

export function SolutionsMenu({ value, onChange, counts }: Props) {
  const active = value !== null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={active ? `Industry Solutions: ${industryLabel(value)}` : "Industry Solutions"}
        className={cn(
          "label-mono focus-visible:ring-ring/60 inline-flex h-8 max-w-[280px] shrink-0 items-center gap-1.5 border px-3 text-[10px] transition-colors outline-none focus-visible:ring-3",
          active
            ? "bg-primary border-primary text-primary-foreground"
            : "bg-surface text-muted-foreground hover:text-foreground border-border data-popup-open:border-primary data-popup-open:text-foreground",
        )}
      >
        <Building2 className="size-3.5 shrink-0" />
        <span className="truncate">{active ? industryLabel(value) : "Industry Solutions"}</span>
        {active && <span className="text-primary-foreground/70 tabular-nums">{counts[value]}</span>}
        <ChevronDown className="size-3.5 shrink-0 transition-transform in-data-popup-open:rotate-180" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={6} className="w-80 rounded-none p-1.5">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="label-mono px-2 pt-1.5 pb-2 text-[10px]">Industry Solutions</DropdownMenuLabel>
          {industries.map(({ id, name, sub }) => {
            const Icon = icons[id]
            const selected = value === id
            return (
              <DropdownMenuItem
                key={id}
                aria-checked={selected}
                onClick={() => onChange(id)}
                className={cn("items-start gap-3 rounded-none px-2 py-2", selected && "bg-accent")}
              >
                <span className="bg-evoq-soft text-evoq-indigo dark:bg-evoq-indigo/30 dark:text-evoq-tint flex size-8 shrink-0 items-center justify-center">
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="text-foreground block text-sm leading-snug font-medium">{name}</span>
                  <span className="text-muted-foreground block text-xs">{sub}</span>
                </span>
                <span className="text-muted-foreground mt-0.5 flex items-center gap-1.5 text-xs tabular-nums">
                  {counts[id]}
                  {selected && <Check className="text-evoq-interactive size-3.5" />}
                </span>
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          aria-checked={value === "all"}
          onClick={() => onChange("all")}
          className={cn("gap-3 rounded-none px-2 py-2", value === "all" && "bg-accent")}
        >
          <span className="text-evoq-interactive dark:text-evoq-bright flex size-8 shrink-0 items-center justify-center">
            <LayoutGrid className="size-4" />
          </span>
          <span className="text-evoq-interactive dark:text-evoq-bright flex-1 text-sm font-semibold">All Industries</span>
          <span className="text-muted-foreground flex items-center gap-1.5 text-xs tabular-nums">
            {counts.all}
            {value === "all" && <Check className="text-evoq-interactive size-3.5" />}
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
