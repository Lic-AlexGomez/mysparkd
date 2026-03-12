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

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Zap className="h-10 w-10 text-primary animate-pulse" />
          <span className="text-sm text-muted-foreground">Cargando...</span>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) return null

  // Permitir acceso al onboarding sin AppShell
  if (pathname === "/onboarding") {
    return <div className="min-h-svh bg-background">{children}</div>
  }

  return (
    <>
      <AppShell>{children}</AppShell>
      <NotificationBanner />
    </>
  )
}
