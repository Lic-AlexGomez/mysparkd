"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Zap } from "lucide-react"

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/login")
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <Zap className="h-8 w-8 text-primary animate-pulse" />
      </div>
    )
  }

  if (!isAuthenticated) return null

  return <div className="min-h-svh bg-background">{children}</div>
}
