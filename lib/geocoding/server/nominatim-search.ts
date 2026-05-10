import type { GeocodeApiSuggestion } from "@/lib/geocoding/types"

const UA = "SparkdApp/1.0 (+https://github.com/Lic-AlexGomez/mysparkd; geocode)"

export async function nominatimForwardSearch(
  q: string,
  opts: { limit?: number; country?: string; biasLat?: number; biasLon?: number; biasDelta?: number }
): Promise<GeocodeApiSuggestion[]> {
  const limit = Math.min(opts.limit ?? 12, 25)
  const params = new URLSearchParams({
    format: "json",
    q,
    limit: String(limit),
    addressdetails: "1",
  })
  const cc = opts.country?.trim().toLowerCase()
  if (cc && cc.length === 2) params.set("countrycodes", cc)

  if (opts.biasLat != null && opts.biasLon != null) {
    const d = opts.biasDelta ?? 0.35
    const lat = opts.biasLat
    const lon = opts.biasLon
    params.set("viewbox", `${lon - d},${lat + d},${lon + d},${lat - d}`)
  }

  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
    headers: {
      Accept: "application/json",
      "Accept-Language": "es,en",
      "User-Agent": UA,
    },
    next: { revalidate: 0 },
  })
  if (!res.ok) throw new Error(`Nominatim search failed: ${res.status}`)
  const rows = (await res.json()) as unknown[]
  if (!Array.isArray(rows)) return []

  return rows.slice(0, limit).map((item: any, i: number) => {
    const addr = item.address || {}
    return {
      id: String(item.place_id ?? `nom-${item.lat}-${item.lon}-${i}`),
      display_name: String(item.display_name || ""),
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
      address: Object.fromEntries(Object.entries(addr).map(([k, v]) => [k, String(v ?? "")])) as Record<string, string>,
    }
  })
}

export async function nominatimReverse(lat: number, lon: number): Promise<{ display_name: string; address: Record<string, string> } | null> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(String(lat))}&lon=${encodeURIComponent(String(lon))}&addressdetails=1`
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      "Accept-Language": "es,en",
      "User-Agent": UA,
    },
    next: { revalidate: 0 },
  })
  if (!res.ok) return null
  const data = (await res.json()) as { display_name?: string; address?: Record<string, string> }
  const addr = data.address || {}
  return {
    display_name: String(data.display_name || ""),
    address: Object.fromEntries(Object.entries(addr).map(([k, v]) => [k, String(v ?? "")])),
  }
}
