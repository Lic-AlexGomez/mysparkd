"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Flame } from "lucide-react"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/feed")
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Flame className="h-10 w-10 text-primary animate-pulse" />
          <span className="text-sm text-muted-foreground">Cargando...</span>
        </div>
      </div>
    )
  }

  if (isAuthenticated) return null

  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden bg-background px-4 py-8">
      <div
        className="pointer-events-none absolute -top-40 -left-40 h-80 w-80 rounded-full opacity-20 blur-3xl"
        style={{ background: "radial-gradient(circle, #8B5CF6, transparent)" }}
      />
      <div
        className="pointer-events-none absolute -bottom-40 -right-40 h-80 w-80 rounded-full opacity-20 blur-3xl"
        style={{ background: "radial-gradient(circle, #EC4899, transparent)" }}
      />
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <Flame className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Sparkd
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Connect, Share, Match
          </p>
        </div>
        {children}
      </div>
    </main>
  )
}
