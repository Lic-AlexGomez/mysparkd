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

/** Edad a partir de fecha ISO (perfil / feed). */
export function computeAgeFromDateOfBirth(dateOfBirth?: string | null): number | null {
  if (!dateOfBirth || typeof dateOfBirth !== 'string') return null
  const d = new Date(dateOfBirth.trim())
  if (Number.isNaN(d.getTime())) return null
  const age = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24 * 365.25))
  if (age < 0 || age > 130) return null
  return age
}
