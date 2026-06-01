"use client"

import Link from "next/link"
import {
  ChevronRight,
  Heart,
  Lock,
  MessageCircle,
  Shield,
  Sparkles,
  Users,
  Zap,
} from "lucide-react"

const SPARK_PILLS = [
  { Icon: Heart, label: "Match", ring: "border-secondary/40 bg-secondary/10 text-secondary" },
  { Icon: MessageCircle, label: "Chat", ring: "border-primary/40 bg-primary/10 text-primary" },
  { Icon: Users, label: "Social", ring: "border-primary/35 bg-primary/8 text-primary" },
] as const

export function WelcomeFooter() {
  return (
    <section className="relative mt-10 w-full">
      <div className="pointer-events-none absolute -inset-1 rounded-[28px] bg-gradient-to-br from-primary/30 via-transparent to-secondary/25 opacity-50 blur-2xl" />

      <div className="relative overflow-hidden rounded-[28px] border border-primary/25 bg-[#08080f]/88 shadow-[0_0_32px_rgba(0,229,255,0.12),0_20px_48px_-16px_rgba(0,0,0,0.75)] backdrop-blur-xl">
        <div className="pointer-events-none absolute -right-16 -top-16 h-36 w-36 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-12 h-32 w-32 rounded-full bg-secondary/15 blur-3xl" />
        <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
        <div className="pointer-events-none absolute inset-x-12 top-1/2 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent" />

        <div className="relative px-5 py-6 sm:px-6 sm:py-7">
          <p className="mb-5 text-center text-[10px] font-bold uppercase tracking-[0.24em] text-primary/75">
            <span className="text-primary/50">⚡</span> Más que una app{" "}
            <span className="animate-sparkd-gradient bg-gradient-to-r from-primary via-cyan-300 to-secondary bg-[length:200%_auto] bg-clip-text text-transparent">
              es una chispa
            </span>{" "}
            <span className="text-primary/50">⚡</span>
          </p>

          <Link
            href="/about"
            className="group relative flex w-full items-center gap-4 overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/[0.06] via-transparent to-secondary/[0.06] p-4 transition-all hover:border-primary/45 hover:shadow-[0_0_32px_rgba(0,229,255,0.15)]"
          >
            <div className="absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-secondary/10" />
            </div>
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-black shadow-[0_0_20px_rgba(0,229,255,0.35)]">
              <Zap className="h-5 w-5 text-primary drop-shadow-[0_0_8px_rgba(0,229,255,0.8)]" strokeWidth={2.5} />
            </div>
            <div className="relative min-w-0 flex-1 text-left">
              <p className="text-[15px] font-bold tracking-wide text-white transition-colors group-hover:text-primary">
                Acerca de Sparkd
              </p>
              <p className="mt-0.5 text-xs text-gray-500">Misión, valores y cómo encendemos conexiones</p>
            </div>
            <ChevronRight className="relative h-5 w-5 shrink-0 text-primary/50 transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
          </Link>

          <div className="mt-5 flex justify-center gap-2">
            {SPARK_PILLS.map(({ Icon, label, ring }) => (
              <div
                key={label}
                className={`flex flex-1 max-w-[108px] flex-col items-center gap-1.5 rounded-xl border px-2 py-2.5 ${ring}`}
              >
                <Icon className="h-4 w-4" strokeWidth={2.5} />
                <span className="text-[10px] font-bold uppercase tracking-[0.12em]">{label}</span>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-2xl border border-white/[0.06] bg-black/40 px-4 py-4 text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-50" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary shadow-[0_0_6px_rgba(0,229,255,0.9)]" />
              </span>
              En vivo ahora
            </span>
            <p className="mt-3 text-sm font-medium text-gray-300">
              Más de{" "}
              <span className="animate-sparkd-gradient bg-gradient-to-r from-primary via-cyan-300 to-secondary bg-[length:200%_auto] bg-clip-text text-base font-black text-transparent">
                9.000
              </span>{" "}
              chispas activas
            </p>
            <p className="mt-1 text-[11px] text-gray-500">Social, match y chat en un solo lugar</p>
          </div>

          <div className="relative mt-5 overflow-hidden rounded-2xl border border-primary/25">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.14] via-transparent to-secondary/[0.12]" />
            <div className="relative flex items-start gap-3 px-4 py-3.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/35 bg-primary/15">
                <Shield className="h-4 w-4 text-primary" strokeWidth={2.5} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3 text-secondary" />
                  <p className="text-xs font-semibold text-white">Privacidad bajo tu control</p>
                  <Lock className="ml-auto h-3 w-3 text-primary/60" aria-hidden />
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-gray-500">
                  Cifrado, bloqueos y permisos claros. Sin vender tus datos.
                </p>
              </div>
            </div>
          </div>

          <div className="my-5 h-px w-full bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

          <p className="text-center text-[11px] leading-relaxed text-gray-500">
            Solo para mayores de{" "}
            <span className="inline-flex items-center rounded-md border border-primary/25 bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
              18+
            </span>
          </p>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-[11px] font-semibold">
            <Link
              href="/terms"
              className="text-gray-500 transition-colors hover:text-primary"
            >
              Términos
            </Link>
            <span className="text-primary/30" aria-hidden>
              ·
            </span>
            <Link
              href="/privacy"
              className="text-gray-500 transition-colors hover:text-secondary"
            >
              Privacidad
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
