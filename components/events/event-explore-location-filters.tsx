"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { MapPin, CalendarDays, Loader2 } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import {
  dateRangeFromPreset,
  DISTANCE_RADIUS_OPTIONS,
  type DateRangePreset,
  type DistanceRadiusKm,
} from "@/lib/event-date-filters"
import { cn } from "@/lib/utils"

type EventExploreLocationFiltersProps = {
  hasLocation: boolean
  locationLoading: boolean
  virtualActive: boolean
  distanceKm: DistanceRadiusKm | null
  onDistanceChange: (km: DistanceRadiusKm | null) => void
  onRequestLocation: () => void
  datePreset: DateRangePreset
  onDatePresetChange: (preset: DateRangePreset) => void
  className?: string
}

export function EventExploreLocationFilters({
  hasLocation,
  locationLoading,
  virtualActive,
  distanceKm,
  onDistanceChange,
  onRequestLocation,
  datePreset,
  onDatePresetChange,
  className,
}: EventExploreLocationFiltersProps) {
  const { te } = useI18n()

  return (
    <div className={cn("grid gap-3 sm:grid-cols-2", className)}>
      <div className="rounded-xl border border-border/60 bg-card/60 p-3">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <MapPin className="size-3.5" />
          {te("Distancia", "Distance")}
        </div>
        {virtualActive ? (
          <p className="mb-2 text-xs text-primary">
            {te("Usando ubicación virtual (Passport)", "Using virtual location (Passport)")}
          </p>
        ) : null}
        {!hasLocation ? (
          <button
            type="button"
            onClick={() => void onRequestLocation()}
            disabled={locationLoading}
            className="w-full rounded-lg border border-dashed border-muted-foreground/35 px-3 py-2 text-left text-xs text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
          >
            {locationLoading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="size-3.5 animate-spin" />
                {te("Obteniendo ubicación…", "Getting location…")}
              </span>
            ) : (
              te(
                "Activa tu ubicación para ver eventos cerca de ti",
                "Enable location to see nearby events"
              )
            )}
          </button>
        ) : (
          <Select
            value={distanceKm != null ? String(distanceKm) : "off"}
            onValueChange={(v) =>
              onDistanceChange(v === "off" ? null : (Number(v) as DistanceRadiusKm))
            }
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder={te("Sin filtro de distancia", "No distance filter")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="off">{te("Sin filtro de distancia", "No distance filter")}</SelectItem>
              {DISTANCE_RADIUS_OPTIONS.map((km) => (
                <SelectItem key={km} value={String(km)}>
                  {km} km
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="rounded-xl border border-border/60 bg-card/60 p-3">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <CalendarDays className="size-3.5" />
          {te("Fechas", "Dates")}
        </div>
        <Select value={datePreset} onValueChange={(v) => onDatePresetChange(v as DateRangePreset)}>
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{te("Todas las fechas", "All dates")}</SelectItem>
            <SelectItem value="week">{te("Esta semana", "This week")}</SelectItem>
            <SelectItem value="month">{te("Este mes", "This month")}</SelectItem>
            <SelectItem value="twoMonths">{te("Próximos 2 meses", "Next 2 months")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

export function buildActivityFeedGeoFilters(opts: {
  lat: number | null
  lng: number | null
  distanceKm: DistanceRadiusKm | null
  datePreset: DateRangePreset
}) {
  const out: Record<string, string | number> = {}
  if (opts.lat != null && opts.lng != null && opts.distanceKm != null) {
    out.lat = opts.lat
    out.lng = opts.lng
    out.radiusKm = opts.distanceKm
  }
  const range = dateRangeFromPreset(opts.datePreset)
  if (range.dateFrom) out.dateFrom = range.dateFrom
  if (range.dateTo) out.dateTo = range.dateTo
  return out
}
