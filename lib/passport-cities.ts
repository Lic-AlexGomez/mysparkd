/** Ciudades populares para Passport (estilo Tinder / Bumble). */
export type PassportCity = {
  id: string
  label: string
  subtitle: string
  latitude: number
  longitude: number
}

export const POPULAR_PASSPORT_CITIES: PassportCity[] = [
  { id: "madrid", label: "Madrid", subtitle: "España", latitude: 40.4168, longitude: -3.7038 },
  { id: "barcelona", label: "Barcelona", subtitle: "España", latitude: 41.3874, longitude: 2.1686 },
  { id: "cdmx", label: "Ciudad de México", subtitle: "México", latitude: 19.4326, longitude: -99.1332 },
  { id: "buenos-aires", label: "Buenos Aires", subtitle: "Argentina", latitude: -34.6037, longitude: -58.3816 },
  { id: "bogota", label: "Bogotá", subtitle: "Colombia", latitude: 4.711, longitude: -74.0721 },
  { id: "miami", label: "Miami", subtitle: "Estados Unidos", latitude: 25.7617, longitude: -80.1918 },
  { id: "nyc", label: "Nueva York", subtitle: "Estados Unidos", latitude: 40.7128, longitude: -74.006 },
  { id: "paris", label: "París", subtitle: "Francia", latitude: 48.8566, longitude: 2.3522 },
  { id: "london", label: "Londres", subtitle: "Reino Unido", latitude: 51.5074, longitude: -0.1278 },
  { id: "rome", label: "Roma", subtitle: "Italia", latitude: 41.9028, longitude: 12.4964 },
  { id: "berlin", label: "Berlín", subtitle: "Alemania", latitude: 52.52, longitude: 13.405 },
  { id: "amsterdam", label: "Ámsterdam", subtitle: "Países Bajos", latitude: 52.3676, longitude: 4.9041 },
]
