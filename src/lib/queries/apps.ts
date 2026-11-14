"use client"

import { useCallback, useMemo, useSyncExternalStore } from "react"
import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { z } from "zod"
import {
  getLocalAppCardSnapshot,
  getServerLocalAppCardSnapshot,
  LOCAL_APP_ID_PREFIX,
  mergeLocalAppCards,
  refreshLocalAppCards,
  subscribeToLocalAppCards,
  setLocalAppStatus,
  writeLocalAppCardState,
} from "@/lib/local-app-cards"
import {
  appDetailsResponseSchema,
  launcherAppListSchema,
  launcherAppSchema,
  type LauncherApp,
} from "@/lib/schemas/app"

const appsResponseSchema = z.object({
  checkedAt: z.iso.datetime(),
  apps: launcherAppListSchema,
})
export type AppsResponse = z.infer<typeof appsResponseSchema>

export function useManagedApps() {
  const query = useQuery(appsQuery)
  const localSnapshot = useSyncExternalStore(
    subscribeToLocalAppCards,
    getLocalAppCardSnapshot,
    getServerLocalAppCardSnapshot,
  )

  const saveLocalState = useCallback((next: Parameters<typeof writeLocalAppCardState>[0]) => {
    writeLocalAppCardState(next)
  }, [])

  const data = useMemo(
    () => query.data && { ...query.data, apps: mergeLocalAppCards(query.data.apps, localSnapshot.state) },
    [query.data, localSnapshot.state],
  )

  return {
    ...query,
    data,
    localState: localSnapshot.state,
    localError: localSnapshot.error,
    refreshLocalState: refreshLocalAppCards,
    saveLocalState,
  }
}

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

type InstallAction = "install" | "uninstall"

async function runInstall({ id, action }: { id: string; action: InstallAction }) {
  const res = await fetch(`/api/apps/${encodeURIComponent(id)}/install`, {
    method: action === "install" ? "POST" : "DELETE",
  })
  if (!res.ok) throw new Error(action === "install" ? "Install failed" : "Uninstall failed")
  return launcherAppSchema.parse(await res.json())
}

/** Install / uninstall one app and patch it into the cached catalog. */
export function useInstallApp(app: LauncherApp) {
  const qc = useQueryClient()
  return useMutation({
    mutationKey: ["install", app.id],
    mutationFn: async (action: InstallAction) =>
      app.id.startsWith(LOCAL_APP_ID_PREFIX)
        ? setLocalAppStatus(app.id, action === "install" ? "installed" : "available")
        : runInstall({ id: app.id, action }),
    onSuccess: (updated) => {
      qc.setQueryData<AppsResponse>(appsQuery.queryKey, (prev) =>
        prev && { ...prev, apps: prev.apps.map((a) => (a.id === updated.id ? updated : a)) },
      )
    },
  })
}
