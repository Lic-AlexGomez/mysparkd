"use client"

import type { ReactNode } from "react"

type SparkBackgroundProps = {
  children: ReactNode
  className?: string
}

/** Fondo neon + rejilla — alineado con móvil `SparkBackground` */
export function SparkBackground({ children, className = "" }: SparkBackgroundProps) {
  return (
    <div className={`relative min-h-svh overflow-hidden bg-black ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-black to-secondary/20" />

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-[22%] left-0 h-[2px] w-full animate-pulse bg-gradient-to-r from-transparent via-primary to-transparent" />
        <div
          className="absolute top-1/2 left-0 h-px w-full bg-gradient-to-r from-transparent via-secondary to-transparent opacity-60"
          style={{ animationDelay: "0.5s" }}
        />
        <div
          className="absolute top-[72%] left-0 h-[2px] w-full animate-pulse bg-gradient-to-r from-transparent via-primary to-transparent"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute left-[22%] top-0 h-full w-[2px] animate-pulse bg-gradient-to-b from-transparent via-secondary to-transparent"
          style={{ animationDelay: "0.3s" }}
        />
        <div
          className="absolute left-1/2 top-0 h-full w-px bg-gradient-to-b from-transparent via-primary to-transparent opacity-60"
          style={{ animationDelay: "0.8s" }}
        />
        <div
          className="absolute left-[76%] top-0 h-full w-[2px] animate-pulse bg-gradient-to-b from-transparent via-secondary to-transparent"
          style={{ animationDelay: "1.2s" }}
        />
      </div>

      <div className="pointer-events-none absolute top-0 -left-10 h-[280px] w-[280px] animate-pulse rounded-full bg-primary/30 blur-[100px]" />
      <div
        className="pointer-events-none absolute -bottom-20 -right-16 h-[340px] w-[340px] animate-pulse rounded-full bg-secondary/30 blur-[100px]"
        style={{ animationDelay: "1s" }}
      />

      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative z-10">{children}</div>
    </div>
  )
}
