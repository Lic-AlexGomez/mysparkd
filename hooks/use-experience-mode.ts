import { useAuth } from '@/lib/auth-context'
import type { AccountType } from '@/lib/types'

export type ExperienceMode = 'SOCIAL' | 'DATING' | 'BOTH'

export function useExperienceMode(): ExperienceMode {
  const { user } = useAuth()
  
  // Si no hay usuario o no tiene accountType definido, por defecto BOTH
  if (!user?.accountType) {
    return 'BOTH'
  }
  
  const accountType = user.accountType.toUpperCase() as AccountType
  
  switch (accountType) {
    case 'SOCIAL':
      return 'SOCIAL'
    case 'DATING':
      return 'DATING'
    case 'BOTH':
      return 'BOTH'
    default:
      return 'BOTH'
  }
}

/**
 * @deprecated Use modes array in navItems instead
 * Esta función se mantiene por compatibilidad pero ya no se usa
 */
export function shouldShowNavItem(href: string, mode: ExperienceMode): boolean {
  // Elementos exclusivos de SOCIAL
  const socialOnlyItems = ['/feed', '/events', '/stories', '/groups', '/activity-feed']
  
  // Elementos exclusivos de DATING
  const datingOnlyItems = ['/swipes', '/matches', '/premium', '/likes', '/fastdate', '/date-cards']
  
  // Elementos comunes a todos los modos
  const commonItems = ['/chat', '/profile']
  
  // Paneles administrativos y herramientas (controlados por feature flags, no por modo)
  const adminItems = ['/dashboard', '/manager', '/trello']
  
  // Los items admin siempre se muestran si el feature flag lo permite
  if (adminItems.includes(href)) return true
  if (commonItems.includes(href)) return true
  
  if (mode === 'BOTH') return true
  
  if (mode === 'SOCIAL') {
    return socialOnlyItems.includes(href) || commonItems.includes(href)
  }
  
  if (mode === 'DATING') {
    return datingOnlyItems.includes(href) || commonItems.includes(href)
  }
  
  return true
}
