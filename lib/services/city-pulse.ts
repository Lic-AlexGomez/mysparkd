import type { CityPulseResponse } from "@/lib/types/city-pulse"

function authHeaders(): HeadersInit {
  const token =
    typeof window !== "undefined" ? window.localStorage.getItem("sparkd_token") : null
  const h: HeadersInit = { Accept: "application/json" }
  if (token) (h as Record<string, string>).Authorization = `Bearer ${token}`
  return h
}

export const cityPulseService = {
  get(params: { city?: string; lat?: number; lng?: number }): Promise<CityPulseResponse> {
    const sp = new URLSearchParams()
    if (params.city?.trim()) sp.set("city", params.city.trim())
    if (params.lat != null && Number.isFinite(params.lat)) sp.set("lat", String(params.lat))
    if (params.lng != null && Number.isFinite(params.lng)) sp.set("lng", String(params.lng))
    const qs = sp.toString()
    return fetch(`/api/city/pulse${qs ? `?${qs}` : ""}`, {
      headers: authHeaders(),
    }).then(async (r) => {
      if (!r.ok) {
        const t = await r.text().catch(() => "")
        throw new Error(t || `HTTP ${r.status}`)
      }
      return r.json() as Promise<CityPulseResponse>
    })
  },
}
