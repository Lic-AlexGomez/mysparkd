/** Centro y zoom iniciales antes de GPS / coords reales (evita asumir un país fijo). */

const CENTERS: Record<string, { lat: number; lng: number; zoom: number }> = {
  US: { lat: 39.8283, lng: -98.5795, zoom: 4 },
  ES: { lat: 40.4168, lng: -3.7038, zoom: 6 },
  MX: { lat: 23.6345, lng: -102.5528, zoom: 5 },
  AR: { lat: -38.4161, lng: -63.6167, zoom: 4 },
  CO: { lat: 4.5709, lng: -74.2973, zoom: 5 },
  GB: { lat: 54.7024, lng: -3.2766, zoom: 5 },
  FR: { lat: 46.6034, lng: 1.8883, zoom: 5 },
  DE: { lat: 51.1657, lng: 10.4515, zoom: 5 },
  PT: { lat: 39.3999, lng: -8.2245, zoom: 6 },
  BR: { lat: -14.235, lng: -51.9253, zoom: 4 },
  CA: { lat: 56.1304, lng: -106.3468, zoom: 3 },
}

export function getMapBootstrapView(countryCode?: string): { lat: number; lng: number; zoom: number } {
  const cc = countryCode?.trim().toUpperCase()
  if (cc && cc.length === 2 && CENTERS[cc]) return CENTERS[cc]

  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ""
    if (tz.startsWith("America/")) return CENTERS.US
    if (tz.startsWith("Europe/Madrid") || tz.startsWith("Atlantic/Canary")) return CENTERS.ES
    if (tz.startsWith("Europe/")) {
      return { lat: 50.1109, lng: 9.8557, zoom: 4 }
    }
    if (tz.startsWith("Asia/")) {
      return { lat: 34.0479, lng: 100.6197, zoom: 3 }
    }
  } catch {
    /* ignore */
  }

  return { lat: 20, lng: 10, zoom: 2 }
}
