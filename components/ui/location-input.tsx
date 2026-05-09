"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "./input"
import { MapPin, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

// Extrae solo provincia y país de una dirección completa
function formatLocation(location: string): string {
  if (!location || location === 'Unknown location') return ''
  const parts = location.split(',')
  if (parts.length <= 2) return location
  // Tomar las últimas 2 partes (provincia, país)
  return parts.slice(-2).map(p => p.trim()).join(', ')
}

interface LocationSuggestion {
  place_id: string
  description: string
  lat: number
  lon: number
  address?: Record<string, string>
  structured_formatting: {
    main_text: string
    secondary_text: string
  }
}

interface LocationInputProps {
  value: string
  onChange: (value: string, coordinates?: { latitude: number; longitude: number }) => void
  placeholder?: string
  className?: string
  valueFormat?: "region" | "full"
}

export function LocationInput({
  value,
  onChange,
  placeholder = "Ciudad, País",
  className,
  valueFormat = "region",
}: LocationInputProps) {
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)

  // Cerrar sugerencias al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(e.target as Node) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const fetchSuggestions = async (input: string) => {
    if (!input || input.length < 3) {
      setSuggestions([])
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(input)}&limit=7&addressdetails=1&featuretype=settlement`,
        { headers: { 'Accept-Language': 'es,en' } }
      )
      const data = await response.json()

      // Filtrar solo tipos relevantes
      const relevantTypes = ['city', 'town', 'village', 'suburb', 'neighbourhood', 'road', 'house', 'residential', 'street', 'municipality', 'county', 'state', 'postcode']
      const filtered = data.filter((item: any) => {
        const type = (item.type || item.class || '').toLowerCase()
        const cls = (item.class || '').toLowerCase()
        return relevantTypes.includes(type) || cls === 'highway' || cls === 'place' || cls === 'boundary' || cls === 'building'
      })

      const formattedSuggestions: LocationSuggestion[] = (filtered.length > 0 ? filtered : data).slice(0, 5).map((item: any) => {
        const addr = item.address || {}
        const mainParts = [
          addr.road || addr.pedestrian || addr.footway,
          addr.house_number,
        ].filter(Boolean)
        const main = mainParts.length > 0
          ? mainParts.join(' ')
          : addr.city || addr.town || addr.village || addr.suburb || item.display_name.split(',')[0]
        const secondary = [
          addr.city || addr.town || addr.village || addr.county,
          addr.state || addr.region,
          addr.country
        ].filter(Boolean).join(', ')

        return {
          place_id: item.place_id,
          description: item.display_name,
          structured_formatting: { main_text: main, secondary_text: secondary },
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
          address: addr,
        }
      })

      setSuggestions(formattedSuggestions)
      setShowSuggestions(true)
    } catch (error) {
      console.error('Error fetching location suggestions:', error)
      setSuggestions([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)
    
    // Debounce para no hacer demasiadas peticiones
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }
    
    debounceTimer.current = setTimeout(() => {
      fetchSuggestions(newValue)
    }, 300)
  }

  const handleSelectSuggestion = (suggestion: LocationSuggestion) => {
    let locationLabel: string
    if (valueFormat === "full") {
      const addr = suggestion.address || {}
      const parts = [
        addr.road || addr.pedestrian,
        addr.house_number,
        addr.city || addr.town || addr.village || addr.suburb,
        addr.state || addr.region,
        addr.country,
      ].filter(Boolean)
      locationLabel = parts.length > 0 ? parts.join(', ') : suggestion.description
    } else {
      const addr = suggestion.address || {}
      const parts = [
        addr.state || addr.province || addr.region || addr.county,
        addr.country
      ].filter(Boolean)
      locationLabel = parts.length > 0 ? parts.join(", ") : suggestion.structured_formatting.main_text
    }

    onChange(locationLabel, {
      latitude: suggestion.lat,
      longitude: suggestion.lon
    })
    setSuggestions([])
    setShowSuggestions(false)
    setSelectedIndex(-1)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelectSuggestion(suggestions[selectedIndex])
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        setSelectedIndex(-1)
        break
    }
  }

  return (
    <div className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true)
            }
          }}
          placeholder={placeholder}
          className={cn("pl-10 pr-10", className)}
          maxLength={100}
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Sugerencias */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.place_id}
              type="button"
              onClick={() => handleSelectSuggestion(suggestion)}
              className={cn(
                "w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors flex items-start gap-3 border-b border-border last:border-0",
                selectedIndex === index && "bg-muted/50"
              )}
            >
              <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {suggestion.structured_formatting.main_text}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {suggestion.structured_formatting.secondary_text}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
