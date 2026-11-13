import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query"
import { z } from "zod"
import {
  appDetailsResponseSchema,
  launcherAppListSchema,
  launcherAppSchema,
  type LauncherApp,
} from "@/lib/schemas/app"

const appsResponseSchema = z.object({
  checkedAt: z.iso.datetime(),
  /** Maintenance banner set by an admin (Admin Portal → Settings). */
  banner: z.string().nullable().default(null),
  apps: launcherAppListSchema,
})
export type AppsResponse = z.infer<typeof appsResponseSchema>

async function fetchApps() {
  const res = await fetch("/api/apps", { cache: "no-store" })
  if (!res.ok) throw new Error(`Could not reach the EVOQ app catalog (${res.status})`)
  // Validate at the boundary so the UI only ever sees well-formed data.
  return appsResponseSchema.parse(await res.json())
}

export const appsQuery = queryOptions({
  queryKey: ["apps"],
  queryFn: fetchApps,
})

async function fetchAppDetails(id: string) {
  const res = await fetch(`/api/apps/${encodeURIComponent(id)}`)
  if (!res.ok) throw new Error(`Could not load app details (${res.status})`)
  return appDetailsResponseSchema.parse(await res.json()).details
}

/** Static per-app content. Install status comes from the catalog query instead. */
export const appDetailsQuery = (id: string) =>
  queryOptions({
    queryKey: ["apps", id, "details"],
    queryFn: () => fetchAppDetails(id),
    staleTime: 10 * 60 * 1000,
  })

async function requestAccess(id: string) {
  const res = await fetch(`/api/apps/${encodeURIComponent(id)}/request`, { method: "POST" })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error((data as { error?: string }).error ?? "Your request couldn't be sent")
  return launcherAppSchema.parse(data)
}

/** Ask an admin for access to one app; patches the cached catalog. */
export function useRequestAccess(app: LauncherApp) {
  const qc = useQueryClient()
  return useMutation({
    mutationKey: ["request-access", app.id],
    mutationFn: () => requestAccess(app.id),
    onSuccess: (updated) => {
      qc.setQueryData<AppsResponse>(appsQuery.queryKey, (prev) =>
        prev && { ...prev, apps: prev.apps.map((a) => (a.id === updated.id ? updated : a)) },
      )
    },
  })
}
