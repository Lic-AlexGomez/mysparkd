import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Extrae solo provincia y país de una dirección completa de Google Maps
export function formatLocation(location?: string | null): string {
  if (!location || location === 'Unknown location') return ''
  const parts = location.split(',')
  if (parts.length <= 2) return location.trim()
  return parts.slice(-2).map(p => p.trim()).join(', ')
}
