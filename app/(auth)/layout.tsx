"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Zap } from "lucide-react"
import { AuthShell } from "@/components/layout/auth-shell"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, isLoading, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoading || !isAuthenticated || !user) return
    router.replace(user.profileCompleted ? "/feed" : "/onboarding")
  }, [isAuthenticated, isLoading, user, router])

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-3">
          <Zap className="h-10 w-10 animate-pulse text-primary" />
          <span className="text-sm text-muted-foreground">Cargando Sparkd...</span>
        </div>
      </div>
    )
  }

  if (isAuthenticated && user) return null

  return <AuthShell>{children}</AuthShell>
}
