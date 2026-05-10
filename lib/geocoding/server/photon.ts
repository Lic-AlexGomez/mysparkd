import type { GeocodeApiSuggestion } from "@/lib/geocoding/types"
import { formatStreetLine } from "@/lib/nominatim-client"

type PhotonFeature = {
  geometry?: { type?: string; coordinates?: [number, number] }
  properties?: Record<string, unknown>
}

function propStr(p: Record<string, unknown> | undefined, key: string): string {
  const v = p?.[key]
  return v != null ? String(v).trim() : ""
}

function photonPropsToAddress(p: Record<string, unknown>): Record<string, string> {
  const cc = propStr(p, "countrycode").toUpperCase()
  return {
    road: propStr(p, "street"),
    house_number: propStr(p, "housenumber"),
    city: propStr(p, "city") || propStr(p, "district") || propStr(p, "locality"),
    town: propStr(p, "district"),
    suburb: propStr(p, "district"),
    state: propStr(p, "state"),
    region: propStr(p, "state"),
    country: propStr(p, "country"),
    country_code: cc.toLowerCase(),
    postcode: propStr(p, "postcode"),
  }
}

/** display_name estilo para formatResolvedPostalLabel */
function photonDisplayName(p: Record<string, unknown>, addr: Record<string, string>): string {
  const cc = addr.country_code?.toUpperCase() || ""
  const name = propStr(p, "name")
  const streetLine = formatStreetLine(addr.road || "", addr.house_number || "", cc)
  const parts = [name, streetLine, addr.city, addr.state, addr.country].filter(Boolean)
  const seen = new Set<string>()
  const uniq = parts.filter((x) => {
    const k = x.toLowerCase()
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
  return uniq.join(", ")
}

export async function photonForwardSearch(
  q: string,
  opts: { limit?: number; country?: string; biasLat?: number; biasLon?: number }
): Promise<GeocodeApiSuggestion[]> {
  const limit = Math.min(opts.limit ?? 12, 30)
  const params = new URLSearchParams({
    q,
    limit: String(limit),
    lang: "en",
  })
  if (opts.biasLat != null && opts.biasLon != null) {
    params.set("lat", String(opts.biasLat))
    params.set("lon", String(opts.biasLon))
  }

  const url = `https://photon.komoot.io/api?${params.toString()}`
  const res = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "SparkdApp/1.0 (address-search)" },
    next: { revalidate: 0 },
  })
  if (!res.ok) throw new Error(`Photon search failed: ${res.status}`)
  const data = (await res.json()) as { features?: PhotonFeature[] }
  const feats = Array.isArray(data.features) ? data.features : []

  const ccFilter = opts.country?.trim().toLowerCase()
  const filtered = ccFilter
    ? feats.filter((f) => propStr(f.properties, "countrycode").toLowerCase() === ccFilter)
    : feats

  const list = (filtered.length > 0 ? filtered : feats).slice(0, limit)

  return list.map((f, i) => {
    const p = f.properties || {}
    const coords = f.geometry?.coordinates
    const lon = coords?.[0] ?? 0
    const lat = coords?.[1] ?? 0
    const addr = photonPropsToAddress(p)
    const osmId = propStr(p, "osm_id") || propStr(p, "osm_key")
    const display_name = photonDisplayName(p, addr)

    return {
      id: `photon-${osmId}-${lat}-${lon}-${i}`,
      display_name,
      lat,
      lon,
      address: {
        ...addr,
        ...(propStr(p, "name") ? { name: propStr(p, "name") } : {}),
      },
    }
  })
}

export async function photonReverse(lat: number, lon: number): Promise<{ display_name: string; address: Record<string, string> } | null> {
  const url = `https://photon.komoot.io/reverse?lat=${encodeURIComponent(String(lat))}&lon=${encodeURIComponent(String(lon))}`
  const res = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "SparkdApp/1.0 (reverse-geocode)" },
    next: { revalidate: 0 },
  })
  if (!res.ok) return null
  const data = (await res.json()) as { features?: PhotonFeature[] }
  const f = data.features?.[0]
  if (!f?.geometry?.coordinates) return null
  const p = f.properties || {}
  const addr = photonPropsToAddress(p)
  const display_name = photonDisplayName(p, addr)
  return { display_name, address: addr }
}
