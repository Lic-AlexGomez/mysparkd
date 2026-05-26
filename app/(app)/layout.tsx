"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter, usePathname } from "next/navigation"
import { useEffect } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { NotificationBanner } from "@/components/ui/notification-banner"
import { AppLoadingScreen } from "@/components/layout/app-loading-screen"

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
    return <AppLoadingScreen />
  }

  if (!isAuthenticated) return null

  // Permitir acceso al onboarding sin AppShell
  if (pathname === "/onboarding") {
    return (
      <div className="min-h-svh w-full overflow-x-hidden bg-black">{children}</div>
    )
  }

  // Event group chat — sin navbar ni dock, igual que /chat/[chatId]
  if (pathname.startsWith("/events/") && pathname.endsWith("/chat")) {
    return <>{children}</>
  }

  return (
    <>
      <AppShell>{children}</AppShell>
      <NotificationBanner />
    </>
  )
}
