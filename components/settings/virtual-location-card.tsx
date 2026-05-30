"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AddressMapPicker } from "@/components/ui/address-map-picker"
import { PassportCitySearch } from "@/components/settings/passport-city-search"
import { useI18n } from "@/lib/i18n"
import { Globe, MapPin, X, Crown, Loader2 } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

type VirtualLocationCardProps = {
  isPremium: boolean
  hasVirtual: boolean
  loading?: boolean
  onSetVirtual: (lat: number, lng: number) => Promise<void>
  onClearVirtual: () => Promise<void>
}

export function VirtualLocationCard({
  isPremium,
  hasVirtual,
  loading = false,
  onSetVirtual,
  onClearVirtual,
}: VirtualLocationCardProps) {
  const { te } = useI18n()
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null)
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const handleActivate = async () => {
    if (!coords) {
      toast.error(te("Busca una ciudad o elige en el mapa", "Search a city or pick on the map"))
      return
    }
    setSaving(true)
    try {
      await onSetVirtual(coords.latitude, coords.longitude)
      toast.success(te("Passport activado", "Passport enabled"))
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : te("No se pudo activar", "Could not enable")
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  const handleClear = async () => {
    setSaving(true)
    try {
      await onClearVirtual()
      setCoords(null)
      setSelectedLabel(null)
      toast.success(te("Volviste a tu ubicación real", "Back to real location"))
    } catch {
      toast.error(te("No se pudo desactivar", "Could not disable"))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="border-border bg-card mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base text-foreground">
          <Globe className="h-4 w-4" />
          {te("Sparkd Passport", "Sparkd Passport")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {te(
            "Explora otra ciudad como en Tinder o Bumble: busca destino, elige un popular o ajusta en el mapa. Solo Premium.",
            "Explore another city like Tinder or Bumble: search, pick a popular spot, or fine-tune on the map. Premium only."
          )}
        </p>

        {!isPremium ? (
          <Button asChild variant="outline" className="w-full">
            <Link href="/premium">
              <Crown className="mr-2 h-4 w-4" />
              {te("Desbloquear con Premium", "Unlock with Premium")}
            </Link>
          </Button>
        ) : (
          <>
            {hasVirtual ? (
              <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm">
                <span className="flex items-center gap-2 font-medium text-primary">
                  <MapPin className="h-4 w-4" />
                  {te("Passport activo", "Passport active")}
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={saving || loading}
                  onClick={() => void handleClear()}
                >
                  <X className="mr-1 h-3.5 w-3.5" />
                  {te("Desactivar", "Disable")}
                </Button>
              </div>
            ) : null}

            <PassportCitySearch
              selectedLabel={selectedLabel}
              onSelect={(city) => {
                setCoords({ latitude: city.latitude, longitude: city.longitude })
                setSelectedLabel(city.subtitle ? `${city.label}, ${city.subtitle}` : city.label)
              }}
            />

            <AddressMapPicker
              latitude={coords?.latitude ?? null}
              longitude={coords?.longitude ?? null}
              onLocationChange={(c, addressLine) => {
                setCoords({ latitude: c.latitude, longitude: c.longitude })
                setSelectedLabel(addressLine || `${c.latitude.toFixed(4)}, ${c.longitude.toFixed(4)}`)
              }}
              helperText={te("Toca el mapa para afinar el punto", "Tap the map to fine-tune")}
            />

            <Button
              type="button"
              className="w-full"
              disabled={!coords || saving || loading}
              onClick={() => void handleActivate()}
            >
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {hasVirtual
                ? te("Actualizar destino", "Update destination")
                : te("Activar Passport", "Enable Passport")}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
