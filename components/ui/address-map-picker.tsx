"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Loader2, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { reverseGeocode } from "@/lib/nominatim-client"
import { getMapBootstrapView } from "@/lib/map-bootstrap-view"
import "leaflet/dist/leaflet.css"

function fixLeafletIcons(L: typeof import("leaflet")) {
  delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: string })._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  })
}

export interface AddressMapPickerProps {
  latitude: number | null
  longitude: number | null
  onLocationChange: (coords: { latitude: number; longitude: number }, addressLine: string) => void
  className?: string
  /** Hint shown under the map */
  helperText?: string
  labels?: Partial<{
    myLocation: string
    syncHint: string
    locatingGps: string
  }>
  /** ISO 3166-1 alpha-2 (ej. desde idioma del navegador) para centrar el mapa antes del GPS */
  bootstrapCountryCode?: string
}

export function AddressMapPicker({
  latitude,
  longitude,
  onLocationChange,
  className,
  helperText,
  labels,
  bootstrapCountryCode,
}: AddressMapPickerProps) {
  const LmyLocation = labels?.myLocation ?? "Mi ubicación"
  const Lsync = labels?.syncHint ?? "Toca el mapa o arrastra el pin; la dirección se sincroniza con el campo."
  const Lgps = labels?.locatingGps ?? "GPS…"
  const wrapRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<import("leaflet").Map | null>(null)
  const markerRef = useRef<import("leaflet").Marker | null>(null)
  const leafletRef = useRef<typeof import("leaflet") | null>(null)
  const skipProgrammaticRef = useRef(false)
  const [mapReady, setMapReady] = useState(false)
  const [geoLoading, setGeoLoading] = useState(false)
  const appliedDefaultGeo = useRef(false)

  const moveMarker = useCallback(
    async (lat: number, lng: number, opts?: { skipReverse?: boolean }) => {
      const L = leafletRef.current
      const map = mapRef.current
      const marker = markerRef.current
      if (!L || !map || !marker) return
      skipProgrammaticRef.current = true
      marker.setLatLng([lat, lng])
      map.setView([lat, lng], Math.max(map.getZoom(), 15))
      queueMicrotask(() => {
        skipProgrammaticRef.current = false
      })
      if (opts?.skipReverse) return
      try {
        const { addressLine } = await reverseGeocode(lat, lng)
        onLocationChange({ latitude: lat, longitude: lng }, addressLine)
      } catch {
        onLocationChange({ latitude: lat, longitude: lng }, `${lat.toFixed(5)}, ${lng.toFixed(5)}`)
      }
    },
    [onLocationChange]
  )

  useEffect(() => {
    let cancelled = false
    const el = wrapRef.current
    if (!el) return

    import("leaflet").then((L) => {
      if (cancelled || !wrapRef.current) return
      fixLeafletIcons(L)
      leafletRef.current = L

      const boot = getMapBootstrapView(bootstrapCountryCode)
      const centerLat = latitude ?? boot.lat
      const centerLng = longitude ?? boot.lng
      const initialZoom = latitude != null && longitude != null ? 15 : boot.zoom
      const map = L.map(el, {
        zoomControl: true,
        attributionControl: true,
      }).setView([centerLat, centerLng], initialZoom)

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
      }).addTo(map)

      const marker = L.marker([centerLat, centerLng], { draggable: true }).addTo(map)
      markerRef.current = marker
      mapRef.current = map

      marker.on("dragend", () => {
        if (skipProgrammaticRef.current) return
        const ll = marker.getLatLng()
        void moveMarker(ll.lat, ll.lng)
      })

      map.on("click", (e: import("leaflet").LeafletMouseEvent) => {
        if (skipProgrammaticRef.current) return
        void moveMarker(e.latlng.lat, e.latlng.lng)
      })

      setMapReady(true)

      if (latitude != null && longitude != null) {
        void moveMarker(latitude, longitude, { skipReverse: true })
      }
    })

    return () => {
      cancelled = true
      mapRef.current?.remove()
      mapRef.current = null
      markerRef.current = null
      leafletRef.current = null
      setMapReady(false)
    }
  }, [])

  useEffect(() => {
    if (!mapReady || latitude == null || longitude == null) return
    const marker = markerRef.current
    const map = mapRef.current
    if (!marker || !map) return
    const ll = marker.getLatLng()
    const same = Math.abs(ll.lat - latitude) < 1e-6 && Math.abs(ll.lng - longitude) < 1e-6
    if (same) return
    void moveMarker(latitude, longitude, { skipReverse: true })
  }, [latitude, longitude, mapReady, moveMarker])

  useEffect(() => {
    if (!mapReady || appliedDefaultGeo.current) return
    if (latitude != null && longitude != null) {
      appliedDefaultGeo.current = true
      return
    }
    if (!navigator.geolocation) {
      appliedDefaultGeo.current = true
      return
    }
    setGeoLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        appliedDefaultGeo.current = true
        setGeoLoading(false)
        void moveMarker(pos.coords.latitude, pos.coords.longitude)
      },
      () => {
        appliedDefaultGeo.current = true
        setGeoLoading(false)
      },
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 60_000 }
    )
  }, [mapReady, latitude, longitude, moveMarker])

  const locateAgain = () => {
    if (!navigator.geolocation) return
    setGeoLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoLoading(false)
        void moveMarker(pos.coords.latitude, pos.coords.longitude)
      },
      () => setGeoLoading(false),
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 0 }
    )
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="relative h-[180px] w-full overflow-hidden rounded-xl border border-border bg-muted/30">
        <div ref={wrapRef} className="absolute inset-0 z-0 h-full w-full [&_.leaflet-container]:h-full [&_.leaflet-container]:w-full [&_.leaflet-container]:bg-muted/40" />
        {!mapReady && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
        {geoLoading && mapReady && (
          <div className="pointer-events-none absolute right-2 top-2 z-[400] rounded-md bg-background/90 px-2 py-1 text-[10px] text-muted-foreground shadow">
            <Loader2 className="mr-1 inline h-3 w-3 animate-spin" />
            {Lgps}
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" className="h-8 gap-1 text-xs" onClick={locateAgain}>
          <MapPin className="h-3.5 w-3.5" />
          {LmyLocation}
        </Button>
        <span className="text-[11px] text-muted-foreground">{Lsync}</span>
      </div>
      {helperText ? <p className="text-[11px] text-muted-foreground">{helperText}</p> : null}
    </div>
  )
}
