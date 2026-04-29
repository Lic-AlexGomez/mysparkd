"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter, usePathname } from "next/navigation"
import { useEffect } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { NotificationBanner } from "@/components/ui/notification-banner"
import { Zap } from "lucide-react"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, isLoading, user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login")
    }
    // Si está autenticado pero no ha completado el perfil, redirigir al onboarding
    if (!isLoading && isAuthenticated && user && !user.profileCompleted && pathname !== "/onboarding") {
      router.replace("/onboarding")
    }
  }, [isAuthenticated, isLoading, user, router, pathname])

  // Solo bloquear la UI si no sabemos aún si hay sesión.
  // Si ya hay token en contexto, renderizamos de inmediato y refrescamos perfil en background.
  if (isLoading && !isAuthenticated) {
    const label =
      pathname === "/onboarding"
        ? "Preparando tu onboarding…"
        : pathname === "/feed" || pathname?.startsWith("/feed/")
          ? "Cargando tu feed…"
          : "Cargando…"
    const iconClass = "h-10 w-10 text-primary animate-pulse"
    return (
      <div className="flex min-h-svh w-full items-center justify-center bg-background px-4">
        <div className="flex max-w-sm flex-col items-center gap-4 text-center">
          {/* Un solo icono de lucide aquí evita fallos HMR/Turbopack con sparkles.js en este layout. */}
          <Zap className={iconClass} aria-hidden />
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">{label}</p>
            <p className="text-xs text-muted-foreground">
              {pathname === "/onboarding"
                ? "Un momento mientras sincronizamos tu cuenta."
                : "Sincronizando tu sesión con Sparkd."}
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) return null

  // Permitir acceso al onboarding sin AppShell
  if (pathname === "/onboarding") {
    return (
      <div className="min-h-svh w-full overflow-x-hidden bg-background">{children}</div>
    )
  }

  return (
    <>
      <AppShell>{children}</AppShell>
      <NotificationBanner />
    </>
  )
}
