/** Sugerencia normalizada entre Photon / Nominatim / Mapbox (respuesta de `/api/geocode`). */
export type GeocodeApiSuggestion = {
  id: string
  /** Dirección completa legible (como display_name Nominatim) */
  display_name: string
  lat: number
  lon: number
  /** Cam tipo Nominatim para formatStreetLine / formatResolvedPostalLabel */
  address: Record<string, string>
}
