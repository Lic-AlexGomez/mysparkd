"use client"

import Link from "next/link"
import { ArrowRight, Heart, MessageCircle, Star, Users, Zap } from "lucide-react"
import { SparkBackground } from "@/components/marketing/spark-background"
import { WelcomeFooter } from "@/components/marketing/welcome-footer"

const FEATURES = [
  {
    Icon: Heart,
    title: "Match Perfecto",
    desc: "Algoritmo inteligente de compatibilidad",
    accent: "primary" as const,
  },
  {
    Icon: MessageCircle,
    title: "Chat Instantáneo",
    desc: "Conversaciones en tiempo real",
    accent: "secondary" as const,
  },
  {
    Icon: Users,
    title: "Red Social",
    desc: "Comparte tu vida auténtica",
    accent: "primary" as const,
  },
]

export function HomeLanding() {
  return (
    <SparkBackground>
      <div className="mx-auto flex min-h-svh w-full max-w-[520px] flex-col items-center px-6 pb-8 pt-10 md:pt-14">
        <div className="relative mb-6 flex items-center justify-center">
          <div className="absolute h-[120px] w-[120px] animate-pulse rounded-full bg-primary/50 blur-2xl" />
          <div className="relative flex h-24 w-24 items-center justify-center rounded-full border-2 border-primary bg-black shadow-[0_0_30px_rgba(0,229,255,0.5)]">
            <Zap className="h-[52px] w-[52px] text-primary drop-shadow-[0_0_15px_rgba(0,229,255,0.8)]" strokeWidth={2.5} />
          </div>
        </div>

        <h1 className="animate-sparkd-gradient text-center text-[44px] font-black tracking-[0.08em] bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_auto] bg-clip-text text-transparent">
          SPARKD
          <span className="sr-only">- Red Social y App de Citas</span>
        </h1>

        <p className="mt-2.5 text-center text-lg font-light tracking-wide text-gray-300">
          Donde las conexiones cobran vida
        </p>
        <p className="mt-3 text-center text-xs font-semibold uppercase tracking-[0.2em] text-primary/80">
          ⚡ La nueva era de conexiones ⚡
        </p>

        <div className="mt-6 grid w-full grid-cols-3 gap-2">
          {FEATURES.map(({ Icon, title, desc, accent }) => (
            <div
              key={title}
              className={`flex flex-col items-center gap-1 rounded-xl border bg-[rgba(15,15,22,0.8)] px-1 py-3 ${
                accent === "secondary" ? "border-secondary/30" : "border-primary/30"
              }`}
            >
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full border ${
                  accent === "secondary"
                    ? "border-secondary/40 bg-secondary/15"
                    : "border-primary/40 bg-primary/15"
                }`}
              >
                <Icon
                  className={`h-5 w-5 ${accent === "secondary" ? "text-secondary" : "text-primary"}`}
                  strokeWidth={2.5}
                />
              </div>
              <p className="text-center text-[11px] font-bold tracking-wide text-white">{title}</p>
              <p className="px-0.5 text-center text-[9px] leading-3 text-gray-500">{desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 w-full">
          <Link
            href="/login"
            className="flex w-full min-h-14 items-center justify-center gap-2.5 rounded-2xl border-[1.5px] border-primary/55 bg-gradient-to-r from-primary to-secondary px-4 text-base font-extrabold tracking-wide text-primary-foreground shadow-[0_4px_24px_rgba(0,229,255,0.35)] transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <Star className="h-[18px] w-[18px] fill-current" />
            Comenzar
            <ArrowRight className="h-[18px] w-[18px]" />
          </Link>
        </div>

        <WelcomeFooter />

        <div className="sr-only">
          <h2>La Mejor App de Citas y Red Social</h2>
          <p>
            Sparkd es la plataforma para conocer gente nueva y encontrar conexiones auténticas con matching
            inteligente, chat en tiempo real y red social.
          </p>
        </div>
      </div>

    </SparkBackground>
  )
}
