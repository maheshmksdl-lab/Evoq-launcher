"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { ArrowUpRight, Search } from "lucide-react"
import { appsQuery } from "@/lib/queries/apps"
import type { AppStatus, LauncherApp } from "@/lib/schemas/app"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"

const statusLabel: Record<AppStatus, string> = {
  active: "Active",
  beta: "Beta",
  "coming-soon": "Coming soon",
}

function AppCard({ app }: { app: LauncherApp }) {
  const disabled = app.status === "coming-soon"
  return (
    <Card className={disabled ? "opacity-60" : "transition-shadow group-hover:shadow-md"}>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle>{app.name}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={app.status === "active" ? "secondary" : "outline"}>
              {statusLabel[app.status]}
            </Badge>
            {!disabled && (
              <ArrowUpRight className="text-muted-foreground size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            )}
          </div>
        </div>
        <CardDescription>{app.description}</CardDescription>
        <p className="text-muted-foreground text-xs">{app.category}</p>
      </CardHeader>
    </Card>
  )
}

export function AppGrid() {
  const [search, setSearch] = useState("")
  const { data: apps, isPending, error, refetch } = useQuery(appsQuery)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!apps || !q) return apps ?? []
    return apps.filter((a) =>
      [a.name, a.description, a.category].some((f) => f.toLowerCase().includes(q)),
    )
  }, [apps, search])

  return (
    <section className="flex flex-col gap-6">
      <div className="relative max-w-sm">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
        <Input
          aria-label="Search apps"
          placeholder="Search apps..."
          className="pl-8"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error ? (
        <div className="flex items-center gap-3 text-sm">
          <p className="text-destructive">{error.message}</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {isPending
            ? Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
            : filtered.map((app) =>
                app.status === "coming-soon" ? (
                  <div key={app.id} aria-disabled="true">
                    <AppCard app={app} />
                  </div>
                ) : (
                  <Link
                    key={app.id}
                    href={app.url}
                    className="group focus-visible:ring-ring rounded-xl outline-none focus-visible:ring-2"
                  >
                    <AppCard app={app} />
                  </Link>
                ),
              )}
          {!isPending && filtered.length === 0 && (
            <p className="text-muted-foreground text-sm">No apps match &quot;{search}&quot;.</p>
          )}
        </div>
      )}
    </section>
  )
}
