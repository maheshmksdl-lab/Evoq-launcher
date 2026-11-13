"use client"

import { useDeferredValue, useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { SearchX } from "lucide-react"
import { industries, industryLabel, type IndustryFilter } from "@/lib/industries"
import { appsQuery } from "@/lib/queries/apps"
import type { LauncherApp, SortKey } from "@/lib/schemas/app"
import { Skeleton } from "@/components/ui/skeleton"
import { AppCard } from "./app-card"
import { AppDetailsDialog } from "./app-details-dialog"
import { AppRow, rowGrid } from "./app-row"
import { CategoryFilter, type CategoryFilterValue } from "./category-filter"
import { StatusBar, TitleBar, Toolbar } from "./chrome"

const sorters: Record<SortKey, (a: LauncherApp, b: LauncherApp) => number> = {
  "name-asc": (a, b) => a.name.localeCompare(b.name),
  "name-desc": (a, b) => b.name.localeCompare(a.name),
  updated: (a, b) => b.updatedAt.localeCompare(a.updatedAt) || a.name.localeCompare(b.name),
  size: (a, b) => b.sizeMb - a.sizeMb,
  category: (a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name),
}

const gridCols = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"

export function Launcher() {
  const { data, isPending, isFetching, error, refetch } = useQuery(appsQuery)
  const [sort, setSort] = useState<SortKey>("name-asc")
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState<CategoryFilterValue>("All")
  // Industry solutions dropdown. Works like a category: picking one clears the
  // pills, and picking a pill clears it.
  const [industry, setIndustry] = useState<IndustryFilter | null>(null)
  const pickCategory = (c: CategoryFilterValue) => {
    setCategory(c)
    setIndustry(null)
  }
  const pickIndustry = (i: IndustryFilter) => {
    setIndustry(i)
    setCategory("All")
  }
  const filterLabel = industry ? industryLabel(industry) : category
  const [view, setView] = useState<"grid" | "list">("grid")
  const [selected, setSelected] = useState<string | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)
  const openDetails = (id: string | null) => {
    setOpenId(id)
    if (id) setSelected(id)
  }
  const query = useDeferredValue(search)

  const all = useMemo(() => data?.apps ?? [], [data])

  const apps = useMemo(() => {
    const q = query.trim().toLowerCase()
    const matchesFilter = (a: LauncherApp) =>
      industry === "all"
        ? a.category === "Solutions"
        : industry
          ? a.industry === industry
          : category === "All" || a.category === category
    const list = all.filter(
      (a) =>
        matchesFilter(a) &&
        (!q ||
          [a.name, a.tagline, a.description, a.category, a.agent?.name ?? "", a.agent?.role ?? ""].some((f) => f.toLowerCase().includes(q))),
    )
    // Products follow the chosen sort; industry solutions stay together after
    // them, in catalog order (Healthcare first, All Industries last).
    const products = list.filter((a) => a.category !== "Solutions").sort(sorters[sort])
    const industries = list.filter((a) => a.category === "Solutions")
    return [...products, ...industries]
  }, [all, query, sort, category, industry])

  const categoryCounts = useMemo(() => {
    const counts: Record<CategoryFilterValue, number> = { All: all.length, Growth: 0, Operations: 0, People: 0, Finance: 0, Platform: 0, AI: 0, Solutions: 0 }
    for (const a of all) counts[a.category]++
    return counts
  }, [all])

  const industryCounts = useMemo(() => {
    const counts = Object.fromEntries(industries.map((i) => [i.id, 0])) as Record<IndustryFilter, number>
    counts.all = 0
    for (const a of all) {
      if (a.category === "Solutions") counts.all++
      if (a.industry) counts[a.industry]++
    }
    return counts
  }, [all])

  const installed = all.filter((a) => a.access === "granted" && (a.status === "installed" || a.status === "update")).length
  const updates = all.filter((a) => a.status === "update").length

  return (
    <div className="flex h-dvh flex-col">
      <TitleBar />
      {data?.banner && (
        <div role="status" className="border-b border-amber-300 bg-amber-50 px-5 py-2 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          {data.banner}
        </div>
      )}

      <Toolbar
        sort={sort}
        onSort={setSort}
        search={search}
        onSearch={setSearch}
        view={view}
        onView={setView}
        onRefresh={() => refetch()}
        refreshing={isFetching}
      />

      <CategoryFilter
        value={category}
        onChange={pickCategory}
        counts={categoryCounts}
        industry={industry}
        onIndustryChange={pickIndustry}
        industryCounts={industryCounts}
      />

      <main className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">
        {error ? (
          <div className="flex flex-col items-start gap-3 border p-6 text-sm">
            <p className="text-destructive">{error.message}</p>
            <button type="button" onClick={() => refetch()} className="label-mono bg-primary text-primary-foreground h-9 px-4">
              Try again
            </button>
          </div>
        ) : isPending ? (
          <div className={`${gridCols} border-t border-l`}>
            {Array.from({ length: 10 }, (_, i) => (
              <div key={i} className="flex flex-col gap-4 border-r border-b p-5">
                <Skeleton className="h-4 w-20 rounded-none" />
                <div className="flex gap-3.5">
                  <Skeleton className="size-14 rounded-md" />
                  <div className="flex flex-1 flex-col gap-2">
                    <Skeleton className="h-5 w-2/3 rounded-none" />
                    <Skeleton className="h-4 w-1/2 rounded-none" />
                  </div>
                </div>
                <Skeleton className="h-16 rounded-none" />
                <Skeleton className="h-9 rounded-none" />
              </div>
            ))}
          </div>
        ) : apps.length === 0 ? (
          <div className="text-muted-foreground flex flex-col items-center gap-2 border py-20 text-sm">
            <SearchX className="size-6" />
            {search ? (
              <>No apps match &quot;{search}&quot;{filterLabel !== "All" && <> in {filterLabel}</>}.</>
            ) : (
              <>No apps in {filterLabel}.</>
            )}
          </div>
        ) : view === "grid" ? (
          <div className={`${gridCols} border-t border-l`}>
            {apps.map((app) => (
              <AppCard key={app.id} app={app} selected={selected === app.id} onSelect={() => openDetails(app.id)} />
            ))}
          </div>
        ) : (
          <div role="table" aria-label="EVOQ apps" className="border-x border-t">
            <div role="row" className={`${rowGrid} label-mono text-muted-foreground bg-surface h-9 border-b text-[10px]`}>
              <span role="columnheader">App</span>
              <span role="columnheader" className="hidden md:block">Category</span>
              <span role="columnheader" className="hidden md:block">Version</span>
              <span role="columnheader" className="hidden md:block">Size</span>
              <span role="columnheader" className="hidden md:block">Updated</span>
              <span role="columnheader" className="hidden md:block">AI agent</span>
              <span role="columnheader" className="sr-only">Actions</span>
            </div>
            {apps.map((app) => (
              <AppRow key={app.id} app={app} selected={selected === app.id} onSelect={() => openDetails(app.id)} />
            ))}
          </div>
        )}
      </main>

      <AppDetailsDialog apps={apps} openId={openId} onOpenChange={openDetails} />

      <StatusBar checkedAt={data?.checkedAt} total={all.length} installed={installed} updates={updates} />
    </div>
  )
}
