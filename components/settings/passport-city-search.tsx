"use client"

import { useState } from "react"
import { MapPin } from "lucide-react"
import { LocationInput } from "@/components/ui/location-input"
import { POPULAR_PASSPORT_CITIES, type PassportCity } from "@/lib/passport-cities"
import { cn } from "@/lib/utils"

export type PassportCityPick = {
  label: string
  subtitle?: string
  latitude: number
  longitude: number
}

type PassportCitySearchProps = {
  selectedLabel?: string | null
  onSelect: (city: PassportCityPick) => void
  className?: string
}

export function PassportCitySearch({ selectedLabel, onSelect, className }: PassportCitySearchProps) {
  const [searchText, setSearchText] = useState("")

  const pick = (city: PassportCity | PassportCityPick) => {
    setSearchText("")
    onSelect({
      label: city.label,
      subtitle: city.subtitle,
      latitude: city.latitude,
      longitude: city.longitude,
    })
  }

  return (
    <div className={cn("space-y-3", className)}>
      <LocationInput
          value={searchText}
          onChange={(value, coordinates) => {
            setSearchText(value)
            if (coordinates) {
              const parts = value.split(",").map((s) => s.trim()).filter(Boolean)
              pick({
                label: parts[0] || value,
                subtitle: parts.slice(1).join(", ") || undefined,
                latitude: coordinates.latitude,
                longitude: coordinates.longitude,
              })
            }
          }}
          placeholder="Buscar ciudad…"
          valueFormat="region"
        />

      {selectedLabel ? (
        <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-primary/35 bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{selectedLabel}</span>
        </div>
      ) : null}

      <div>
        <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
          Destinos populares
        </p>
        <div className="flex flex-wrap gap-2">
          {POPULAR_PASSPORT_CITIES.map((city) => (
            <button
              key={city.id}
              type="button"
              onClick={() => pick(city)}
              className="rounded-full border border-border bg-muted/50 px-3 py-1.5 text-left transition hover:border-primary/40 hover:bg-primary/5"
            >
              <span className="block text-sm font-semibold text-foreground">{city.label}</span>
              <span className="block text-[10px] text-muted-foreground">{city.subtitle}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
