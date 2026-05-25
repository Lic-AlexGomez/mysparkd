"use client"

import Link from "next/link"
import { ChevronRight, Shield, Sparkles, Users, Zap } from "lucide-react"

const AVATAR_GRADIENTS = [
  "from-primary/80 to-cyan-400/60",
  "from-secondary/80 to-fuchsia-400/60",
  "from-primary/60 to-secondary/60",
  "from-violet-500/70 to-primary/50",
] as const

export function WelcomeFooter() {
  return (
    <section className="relative mt-10 w-full">
      <div
        className="pointer-events-none absolute -inset-px rounded-[26px] opacity-70 blur-2xl"
        style={{
          background:
            "linear-gradient(135deg, rgba(0,229,255,0.18) 0%, transparent 45%, rgba(217,70,239,0.14) 100%)",
        }}
      />

      <div className="relative overflow-hidden rounded-[26px] border border-white/[0.1] bg-[#08080f]/90 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.65)] backdrop-blur-xl">
        <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-secondary/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-12 h-36 w-36 rounded-full bg-primary/12 blur-3xl" />
        <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />

        <div className="relative space-y-5 px-5 py-6 sm:px-6 sm:py-7">
          <Link
            href="/about"
            className="group flex w-full items-center gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4 transition-all hover:border-primary/35 hover:bg-primary/[0.07] hover:shadow-[0_0_28px_rgba(0,229,255,0.12)]"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-primary/25 bg-gradient-to-br from-primary/25 to-secondary/20 shadow-inner">
              <Zap className="h-5 w-5 text-primary" strokeWidth={2.5} />
            </div>
            <div className="min-w-0 flex-1 text-left">
              <p className="text-[15px] font-semibold text-white transition-colors group-hover:text-primary">
                Acerca de Sparkd
              </p>
              <p className="mt-0.5 text-xs text-gray-500">Conoce nuestra misión y cómo conectamos personas</p>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-gray-600 transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
          </Link>

          <div className="rounded-2xl border border-white/[0.06] bg-black/50 px-4 py-5">
            <div className="flex flex-col items-center">
              <div className="mb-3 flex items-center">
                {AVATAR_GRADIENTS.map((gradient, i) => (
                  <div
                    key={gradient}
                    className={`relative flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#08080f] bg-gradient-to-br ${gradient} shadow-md ${i > 0 ? "-ml-2.5" : ""}`}
                    style={{ zIndex: AVATAR_GRADIENTS.length - i }}
                  >
                    <Users className="h-3.5 w-3.5 text-white/90" strokeWidth={2.5} />
                  </div>
                ))}
                <div className="-ml-2.5 flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#08080f] bg-[#14141c] text-[10px] font-bold text-primary">
                  +9k
                </div>
              </div>

              <span className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-400">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                Comunidad activa
              </span>

              <p className="text-center text-[15px] font-medium leading-snug text-gray-200">
                Únete a{" "}
                <span className="bg-gradient-to-r from-primary via-cyan-300 to-secondary bg-clip-text font-bold text-transparent">
                  miles de personas
                </span>
              </p>
              <p className="mt-1 text-center text-xs text-gray-500">conectando ahora mismo en Sparkd</p>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-center text-[11px] leading-relaxed text-gray-500">
              Al registrarte confirmas tener al menos{" "}
              <span className="inline-flex items-center rounded-md border border-white/10 bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-bold text-gray-300">
                18+
              </span>
            </p>

            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/terms"
                className="rounded-xl border border-white/[0.08] bg-white/[0.03] py-2.5 text-center text-xs font-semibold text-gray-400 transition-colors hover:border-primary/30 hover:bg-primary/[0.06] hover:text-primary"
              >
                Términos de Servicio
              </Link>
              <Link
                href="/privacy"
                className="rounded-xl border border-white/[0.08] bg-white/[0.03] py-2.5 text-center text-xs font-semibold text-gray-400 transition-colors hover:border-secondary/30 hover:bg-secondary/[0.06] hover:text-secondary"
              >
                Política de Privacidad
              </Link>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-primary/20">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.12] via-transparent to-secondary/[0.1]" />
            <div className="relative flex items-start gap-3.5 px-4 py-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-primary/15">
                <Shield className="h-4 w-4 text-primary" strokeWidth={2.5} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3 text-secondary/90" />
                  <p className="text-xs font-semibold text-gray-200">Tu privacidad es nuestra prioridad</p>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-gray-500">
                  Datos cifrados y control total sobre quién te contacta. Nunca vendemos tu información.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
