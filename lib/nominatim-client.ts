/** Headers recommended for Nominatim usage policy (browser sends its own User-Agent too). */
export function nominatimFetchHeaders(): HeadersInit {
  const lang = typeof navigator !== "undefined" ? navigator.language : "es,en"
  return {
    Accept: "application/json",
    "Accept-Language": lang.includes(",") ? lang : `${lang},en`,
  }
}

/** Países donde lo habitual es «número + nombre de calle» (p. ej. 123 Main St). */
const HOUSE_NUMBER_FIRST_COUNTRIES = new Set([
  "US",
  "CA",
  "AU",
  "NZ",
  "GB",
  "IE",
])

/**
 * Une número y vía según convención local (Nominatim devuelve `country_code` ISO2 en minúsculas).
 */
export function formatStreetLine(
  road: string,
  houseNumber: string,
  countryCode?: string
): string {
  const r = String(road || "").trim()
  const h = String(houseNumber || "").trim()
  const cc = String(countryCode || "").trim().toUpperCase()
  if (!r && !h) return ""
  if (HOUSE_NUMBER_FIRST_COUNTRIES.has(cc)) {
    return [h, r].filter(Boolean).join(" ").trim()
  }
  if (r && h) return `${r}, ${h}`
  return r || h
}

export function formatAddressFromNominatim(addr: Record<string, string> | undefined, fallback: string): string {
  if (!addr || typeof addr !== "object") return fallback
  const cc = String(addr.country_code || "").toUpperCase()
  const street = formatStreetLine(
    String(addr.road || addr.pedestrian || ""),
    String(addr.house_number || ""),
    cc
  )
  const parts = [
    street,
    addr.city || addr.town || addr.village || addr.suburb,
    addr.state || addr.region,
    addr.country,
  ].filter(Boolean)
  return parts.length > 0 ? parts.join(", ") : fallback
}

/**
 * Texto a guardar en el campo de dirección: para establecimientos/POIs los campos `address`
 * suelen ir sin calle/número; `display_name` trae nombre del negocio + dirección postal completa.
 */
export function formatResolvedPostalLabel(
  addr: Record<string, string> | undefined,
  displayName: string
): string {
  const dn = String(displayName || "").trim()
  const a = addr && typeof addr === "object" ? addr : {}
  const structured = formatAddressFromNominatim(a, "").trim()

  const hasRoadDetail =
    !!(a.house_number?.trim() || a.road?.trim() || a.pedestrian?.trim())

  if (hasRoadDetail && structured.length > 0) return structured

  if (dn.length > 0) return dn

  return structured || dn
}

export async function reverseGeocode(lat: number, lon: number): Promise<{ displayName: string; addressLine: string }> {
  const res = await fetch(
    `/api/reverse-geocode?lat=${encodeURIComponent(String(lat))}&lon=${encodeURIComponent(String(lon))}`,
    { headers: { Accept: "application/json" } }
  )
  if (!res.ok) throw new Error("Reverse geocode failed")
  const data = (await res.json()) as { display_name?: string; address?: Record<string, string> }
  const displayName = String(data.display_name || "")
  const addressLine = formatResolvedPostalLabel(data.address || {}, displayName)
  return { displayName, addressLine }
}
