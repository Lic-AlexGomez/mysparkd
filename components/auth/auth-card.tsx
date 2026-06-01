import type { ReactNode } from "react"

export function AuthCard({ children }: { children: ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-[rgba(12,13,18,0.95)] p-5 shadow-[0_4px_24px_rgba(0,229,255,0.08)] backdrop-blur-sm">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/[0.04] via-transparent to-secondary/[0.04]" />
      <div className="relative">{children}</div>
    </div>
  )
}
