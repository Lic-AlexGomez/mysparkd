import type { GeocodeApiSuggestion } from "@/lib/geocoding/types"

/** Mapbox Geocoding API v5 — `MAPBOX_ACCESS_TOKEN` en el servidor */
export async function mapboxForwardSearch(
  q: string,
  token: string,
  opts: { limit?: number; country?: string; biasLat?: number; biasLon?: number }
): Promise<GeocodeApiSuggestion[]> {
  const limit = Math.min(opts.limit ?? 8, 10)
  const params = new URLSearchParams({
    access_token: token,
    limit: String(limit),
    types: "address,poi,place,locality,neighborhood,region,postcode,district",
    autocomplete: "true",
  })
  if (opts.country && opts.country.length === 2) {
    params.append("country", opts.country.trim().toUpperCase())
  }
  if (opts.biasLat != null && opts.biasLon != null) {
    params.append("proximity", `${opts.biasLon},${opts.biasLat}`)
  }

  const encodedQuery = encodeURIComponent(q.trim())
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedQuery}.json?${params}`
  const res = await fetch(url, { next: { revalidate: 0 } })
  if (!res.ok) throw new Error(`Mapbox geocode failed: ${res.status}`)
  const data = (await res.json()) as {
    features?: Array<{
      id?: string
      place_name?: string
      geometry?: { coordinates?: [number, number] }
    }>
  }
  const feats = Array.isArray(data.features) ? data.features : []

  return feats.slice(0, limit).map((f, i) => {
    const [flon, flat] = f.geometry?.coordinates ?? [0, 0]
    return {
      id: String(f.id ?? `mb-${i}`),
      display_name: String(f.place_name || q),
      lat: flat,
      lon: flon,
      address: {},
    }
  })
}
