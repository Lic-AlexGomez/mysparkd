"use client"

import Link from "next/link"
import type { ReactNode } from "react"
import { Zap } from "lucide-react"
import { SparkBackground } from "@/components/marketing/spark-background"

type AuthShellProps = {
  children: ReactNode
}

/** Layout auth alineado con móvil (`AuthShell` + `SparkBackground`). */
export function AuthShell({ children }: AuthShellProps) {
  return (
    <SparkBackground>
      <div className="pointer-events-none absolute -left-20 -top-20 h-[280px] w-[280px] rounded-full bg-[#8B5CF6]/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-[320px] w-[320px] rounded-full bg-[#EC4899]/20 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-[38%] h-[200px] w-[200px] -translate-x-1/2 rounded-full bg-[#3B82F6]/10 blur-3xl" />

      <div className="relative z-10 mx-auto flex min-h-svh w-full max-w-[440px] flex-col justify-center px-6 py-10">
        <Link
          href="/"
          className="group mb-2 flex items-center justify-center gap-3 transition-transform hover:scale-[1.02]"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary shadow-lg shadow-primary/40 transition-shadow group-hover:shadow-primary/55">
            <Zap className="h-8 w-8 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <span className="text-4xl font-extrabold tracking-tight text-primary">Sparkd</span>
        </Link>
        <p className="mb-6 text-center text-sm font-medium tracking-wide text-muted-foreground">
          ⚡ Conecta, Comparte, Encuentra ⚡
        </p>
        {children}
      </div>
    </SparkBackground>
  )
}
