"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "./input"
import { MapPin, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface LocationSuggestion {
  place_id: string
  description: string
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
}

export function LocationInput({ value, onChange, placeholder = "Ciudad, País", className }: LocationInputProps) {
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const debounceTimer = useRef<NodeJS.Timeout>()

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
      // Usar Nominatim (OpenStreetMap) - API gratuita
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(input)}&limit=5&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'es'
          }
        }
      )
      
      const data = await response.json()
      
      const formattedSuggestions: LocationSuggestion[] = data.map((item: any) => ({
        place_id: item.place_id,
        description: item.display_name,
        structured_formatting: {
          main_text: item.name || item.display_name.split(',')[0],
          secondary_text: item.display_name.split(',').slice(1).join(',').trim()
        },
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon)
      }))
      
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

  const handleSelectSuggestion = (suggestion: any) => {
    onChange(suggestion.description, {
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
