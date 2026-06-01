import type { ActivityCoreExperienceMode, ActivityCoreStreamResponse } from "@/lib/types/activity-core-stream"

function authHeaders(): HeadersInit {
  const token =
    typeof window !== "undefined" ? window.localStorage.getItem("sparkd_token") : null
  const h: HeadersInit = { Accept: "application/json" }
  if (token) (h as Record<string, string>).Authorization = `Bearer ${token}`
  return h
}

export function buildActivityCoreStreamUrl(opts: {
  lat?: number
  lng?: number
  city?: string
  limit?: number
  mode?: ActivityCoreExperienceMode
}): string {
  const q = new URLSearchParams()
  if (opts.city?.trim()) q.set("city", opts.city.trim())
  if (opts.lat != null && opts.lng != null && Number.isFinite(opts.lat) && Number.isFinite(opts.lng)) {
    q.set("lat", String(opts.lat))
    q.set("lng", String(opts.lng))
  }
  if (opts.limit != null && Number.isFinite(opts.limit)) q.set("limit", String(opts.limit))
  if (opts.mode) q.set("mode", opts.mode)
  const qs = q.toString()
  return `/api/activity/core-stream${qs ? `?${qs}` : ""}`
}

export const activityCoreStreamService = {
  get(opts: {
    lat?: number
    lng?: number
    city?: string
    limit?: number
    mode?: ActivityCoreExperienceMode
  }): Promise<ActivityCoreStreamResponse> {
    return fetch(buildActivityCoreStreamUrl(opts), { headers: authHeaders() }).then(async (r) => {
      if (!r.ok) throw new Error(await r.text())
      return r.json() as Promise<ActivityCoreStreamResponse>
    })
  },
}
