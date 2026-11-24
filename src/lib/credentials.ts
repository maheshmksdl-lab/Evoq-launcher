"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

export type AppCredentials = { username: string; password: string }

/*
 * Credentials live in the database, behind authenticated API routes. The list
 * query only says which apps have credentials; the secret itself is fetched
 * on demand when the dialog opens and kept out of long-lived cache.
 */
const listKey = ["credentials"] as const
const valueKey = (appId: string) => ["credentials", appId] as const

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { cache: "no-store", ...init })
  const body = await res.json().catch(() => null)
  if (!res.ok) throw new Error(body?.error ?? `Request failed (${res.status})`)
  return body as T
}

const url = (appId: string) => `/api/credentials/${encodeURIComponent(appId)}`

export function useCredentialAppIds() {
  return useQuery({
    queryKey: listKey,
    queryFn: async () => new Set((await api<{ appIds: string[] }>("/api/credentials")).appIds),
  })
}

/** Decrypted credentials for one app. Only enable while the dialog is open. */
export function useCredentialsValue(appId: string, enabled: boolean) {
  return useQuery({
    queryKey: valueKey(appId),
    queryFn: () => api<AppCredentials>(url(appId)),
    enabled,
    gcTime: 0,
    staleTime: 0,
  })
}

export function useAppCredentials(appId: string) {
  const qc = useQueryClient()
  const ids = useCredentialAppIds()

  const save = useMutation({
    mutationFn: (value: AppCredentials) =>
      api(url(appId), { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(value) }),
    onSuccess: async () => {
      qc.removeQueries({ queryKey: valueKey(appId) })
      await qc.invalidateQueries({ queryKey: listKey })
    },
  })

  const remove = useMutation({
    mutationFn: () => api(url(appId), { method: "DELETE" }),
    onSuccess: async () => {
      qc.removeQueries({ queryKey: valueKey(appId) })
      await qc.invalidateQueries({ queryKey: listKey })
    },
  })

  return {
    loading: ids.isPending,
    hasCredentials: ids.data?.has(appId) ?? false,
    save,
    remove,
  }
}
