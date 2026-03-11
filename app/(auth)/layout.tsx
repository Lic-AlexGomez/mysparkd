"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import Link from "next/link"
import { Zap } from "lucide-react"

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
          <Zap className="h-10 w-10 text-primary animate-pulse" />
          <span className="text-sm text-muted-foreground">Cargando...</span>
        </div>
      </div>
    )
  }

  if (isAuthenticated) return null

  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden bg-gradient-to-br from-background via-background to-muted/30 px-4 py-8">
      {/* Efectos de fondo mejorados */}
      <div
        className="pointer-events-none absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full opacity-20 blur-3xl animate-pulse"
        style={{ background: "radial-gradient(circle, #8B5CF6, transparent)" }}
      />
      <div
        className="pointer-events-none absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full opacity-20 blur-3xl animate-pulse"
        style={{ background: "radial-gradient(circle, #EC4899, transparent)", animationDelay: "1s" }}
      />
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[700px] w-[700px] rounded-full opacity-10 blur-3xl animate-pulse"
        style={{ background: "radial-gradient(circle, #3B82F6, transparent)", animationDelay: "2s" }}
      />
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3">
          <Link href="/" className="group flex items-center gap-3 mb-2 transition-all hover:scale-105 cursor-pointer">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-primary to-secondary shadow-xl shadow-primary/40 group-hover:shadow-2xl group-hover:shadow-primary/50 transition-all">
              <Zap className="h-8 w-8 text-primary-foreground drop-shadow-lg" />
            </div>
            <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-primary via-primary to-secondary bg-clip-text text-transparent drop-shadow-sm">
              Sparkd
            </h1>
          </Link>
          <p className="text-base text-muted-foreground font-medium tracking-wide">
            ⚡ Conecta, Comparte, Encuentra ⚡
          </p>
        </div>
        {children}
      </div>
    </main>
  )
}
