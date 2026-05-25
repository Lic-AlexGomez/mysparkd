"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Zap } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { HomeLanding } from "@/components/marketing/home-landing"

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/feed")
    }
  }, [isAuthenticated, isLoading, router])

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

  if (!isAuthenticated) {
    return <HomeLanding />
  }

  return null
}
