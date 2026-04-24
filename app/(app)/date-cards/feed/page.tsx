"use client"

import React, { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/lib/auth-context'

type DateCardCard = {
  id: string
  name: string
  lat: number
  lon: number
  age?: number
  interests: string[]
  bio?: string
  avatarUrl?: string
}

export default function DateCardsFeedPage() {
  const { user } = useAuth()
  const viewerId = user?.userId ?? ''

  const [cards, setCards] = useState<DateCardCard[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [distanceKm, setDistanceKm] = useState<number>(20)
  const [lat, setLat] = useState<string>('')
  const [lon, setLon] = useState<string>('')
  const [interests, setInterests] = useState<string>('')
  const [excludeDisliked, setExcludeDisliked] = useState<boolean>(true)

  // Load cards with current filters
  const fetchCards = async () => {
    setLoading(true)
    setError(null)

    try {
      const params: string[] = []
      if (lat && lon) {
        params.push(`lat=${encodeURIComponent(lat)}`)
        params.push(`lon=${encodeURIComponent(lon)}`)
        params.push(`distanceKm=${distanceKm}`)
      }
      if (interests.trim()) {
        params.push(`interests=${encodeURIComponent(interests.trim())}`)
      }
      if (excludeDisliked) {
        params.push(`excludeDisliked=true`)
      }
      if (viewerId) {
        params.push(`viewerId=${encodeURIComponent(viewerId)}`)
      }

      const query = params.length ? `?${params.join('&')}` : ''
      const res = await fetch(`/api/date-cards/feed${query}`)
      if (!res.ok) throw new Error('Error al obtener date cards')
      const data = (await res.json()) as DateCardCard[]
      setCards(data)
    } catch (e) {
      setError('Error al cargar feed')
    } finally {
      setLoading(false)
    }
  }

  // Try to auto-fill location on first load if user allows
  const useMyLocation = async () => {
    if (!('geolocation' in navigator)) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        setLat(String(latitude))
        setLon(String(longitude))
      },
      () => {
        // ignore errors
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    )
  }

  // Initial load on mount
  useEffect(() => {
    // Try to prefill lat/lon if available from user context in future
  }, [])

  // Helper to render a single card
  const renderCard = (card: DateCardCard) => (
    <div key={card.id} className="border rounded-lg p-4 shadow-sm flex items-center gap-4">
      <div className="h-12 w-12 rounded-full bg-gray-200" aria-label={`${card.name} avatar`} />
      <div>
        <div className="font-semibold">{card.name}</div>
        <div className="text-sm text-muted-foreground">Intereses: {card.interests.join(', ')}</div>
      </div>
    </div>
  )

  return (
    <section className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">Fecha (Date Cards) - Feed</h1>

      <div className="border rounded-lg p-4 bg-card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="text-sm text-foreground/70">Distancia (km)</label>
            <input
              type="number"
              min={1}
              value={distanceKm}
              onChange={(e) => setDistanceKm(Number(e.target.value))}
              className="mt-1 w-full rounded border px-2 py-1"
            />
          </div>
          <div>
            <label className="text-sm text-foreground/70">Lat</label>
            <input
              type="text"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              placeholder="lat"
              className="mt-1 w-full rounded border px-2 py-1"
            />
          </div>
          <div>
            <label className="text-sm text-foreground/70">Lon</label>
            <input
              type="text"
              value={lon}
              onChange={(e) => setLon(e.target.value)}
              placeholder="lon"
              className="mt-1 w-full rounded border px-2 py-1"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="text-sm text-foreground/70">Intereses (comma separated)</label>
            <input
              type="text"
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              placeholder="p. ej. cine,música,arte"
              className="mt-1 w-full rounded border px-2 py-1"
            />
          </div>
          <div className="flex items-end">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={excludeDisliked}
                onChange={(e) => setExcludeDisliked(e.target.checked)}
              />
              Excluir dislikes previos
            </label>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <button className="btn" onClick={useMyLocation}>Usar mi ubicación</button>
          <button className="btn" onClick={() => fetchCards()} disabled={loading}>
            {loading ? 'Cargando...' : 'Aplicar filtros'}
          </button>
          <button className="btn ghost" onClick={() => {
            setDistanceKm(20); setLat(''); setLon(''); setInterests(''); setExcludeDisliked(true)
          }}>Limpiar</button>
        </div>
      </div>

      {error && <div className="text-red-500">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map(renderCard)}
      </div>

      {cards.length === 0 && !loading && (
        <div className="text-sm text-foreground/70">No hay resultados con los filtros actuales.</div>
      )}
    </section>
  )
}
