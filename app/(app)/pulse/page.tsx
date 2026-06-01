"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useFeatureFlags } from "@/hooks/use-feature-flags"
import { Radio, Loader2 } from "lucide-react"

export default function PulsePage() {
  const features = useFeatureFlags()
  const router = useRouter()
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    if (!features.tonightPage) {
      router.replace("/feed")
      return
    }
  }, [features.tonightPage, router])

  useEffect(() => {
    if (countdown <= 0) {
      router.push("/tonight")
      return
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown, router])

  if (!features.tonightPage) return null

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-[radial-gradient(circle_at_top,#111827_0%,#050505_45%)] px-4 text-center">
      <div className="relative">
        <Radio className="h-16 w-16 text-orange-500/50" />
        <div className="absolute inset-0 animate-ping rounded-full bg-orange-500/10" />
      </div>

      <div>
        <h1 className="text-3xl font-black tracking-tight text-white">
          City Pulse
        </h1>
        <p className="mt-2 text-sm text-white/40">
          Próximamente — la actividad de la ciudad en tiempo real
        </p>
      </div>

      <div className="h-px w-24 bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      <p className="text-xs text-white/30">
        Redirigiendo a Tonight en {countdown}s...
      </p>

      <button
        onClick={() => router.push("/tonight")}
        className="rounded-full border border-white/10 bg-white/[0.04] px-6 py-2 text-xs font-bold text-white/60 transition-all hover:border-white/20 hover:text-white"
      >
        Ir a Tonight ahora
      </button>
    </div>
  )
}
