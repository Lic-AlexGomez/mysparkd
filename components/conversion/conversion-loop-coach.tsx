"use client"

import Link from "next/link"
import { Route, Loader2, ChevronRight } from "lucide-react"
import { useConversionLoop } from "@/hooks/use-conversion-loop"
import { cn } from "@/lib/utils"

export function ConversionLoopCoach({
  userId,
  te,
  className,
}: {
  userId: string | undefined
  te: (es: string, en: string) => string
  className?: string
}) {
  const { insights, actions, loading } = useConversionLoop(userId, { enabled: Boolean(userId) })

  if (!userId) return null

  const topDrop = insights?.drop_offs?.[0]
  const primary = actions[0]

  if (!topDrop && !primary && !loading) {
    return null
  }

  return (
    <section
      aria-label={te("Bucle de conversión", "Conversion loop")}
      className={cn(
        "rounded-2xl border border-emerald-500/25 bg-gradient-to-r from-emerald-500/[0.07] via-card to-teal-500/[0.05] px-3 py-2.5 shadow-sm ring-1 ring-emerald-500/10 sm:px-4",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <Route className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
        <p className="min-w-0 flex-1 truncate text-xs font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
          {te("De la app al encuentro real", "From app to real life")}
        </p>
        {loading ? (
          <Loader2 className="size-3.5 shrink-0 animate-spin text-muted-foreground" aria-hidden />
        ) : null}
      </div>

      {topDrop ? (
        <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
          {topDrop.severity === "hard"
            ? te("Detectamos un punto de fricción — te guiamos.", "We spotted friction — here’s a nudge.")
            : te("Siguiente paso sugerido para mantener el ritmo.", "Suggested next step to keep momentum.")}
        </p>
      ) : (
        <p className="mt-1 text-[11px] text-muted-foreground">
          {te(
            "Explora eventos, chats y Fast Date para cerrar el círculo.",
            "Explore events, chat, and Fast Date to close the loop."
          )}
        </p>
      )}

      {primary ? (
        <div className="mt-2 rounded-lg bg-background/70 px-2 py-1.5 ring-1 ring-border/50 dark:bg-background/45">
          <Link
            href={primary.deeplink}
            className="flex items-center justify-between gap-2 text-[11px] font-semibold text-foreground hover:text-primary"
          >
            <span className="min-w-0 truncate">{primary.title}</span>
            <ChevronRight className="size-3 shrink-0 opacity-60" aria-hidden />
          </Link>
        </div>
      ) : loading ? (
        <p className="mt-2 text-[11px] text-muted-foreground">…</p>
      ) : null}
    </section>
  )
}
