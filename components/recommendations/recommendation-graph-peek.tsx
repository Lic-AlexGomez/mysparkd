"use client"

import Link from "next/link"
import { Sparkles, Loader2, ChevronRight } from "lucide-react"
import { useRecommendationGraphV2 } from "@/hooks/use-recommendation-graph-v2"
import { cn } from "@/lib/utils"

export function RecommendationGraphPeek({
  userId,
  te,
  className,
}: {
  userId: string | undefined
  te: (es: string, en: string) => string
  className?: string
}) {
  const { bundle, loading } = useRecommendationGraphV2(userId, { enabled: Boolean(userId) })

  const topPerson = bundle?.people?.[0]
  const topEvent = bundle?.events?.[0]
  const topGroup = bundle?.groups?.[0]
  const topFd = bundle?.fast_dates?.[0]

  if (!userId) return null

  return (
    <section
      aria-label={te("Recomendaciones", "Recommendations")}
      className={cn(
        "rounded-2xl border border-sky-500/25 bg-gradient-to-r from-sky-500/[0.06] via-card to-violet-500/[0.05] px-3 py-2.5 shadow-sm ring-1 ring-sky-500/10 sm:px-4",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 shrink-0 text-sky-500" aria-hidden />
        <p className="min-w-0 flex-1 truncate text-xs font-bold uppercase tracking-wide text-sky-600 dark:text-sky-300">
          {te("Te entendemos — próximo encuentro", "We get who you should meet next")}
        </p>
        {loading ? <Loader2 className="size-3.5 shrink-0 animate-spin text-muted-foreground" aria-hidden /> : null}
      </div>

      {bundle?.partial ? (
        <p className="mt-1 text-[10px] text-amber-600 dark:text-amber-400">
          {te("Datos parciales — sincronizando grafo…", "Partial data — syncing graph…")}
        </p>
      ) : null}

      <ul className="mt-2 space-y-1.5 text-[11px] leading-snug">
        {topPerson ? (
          <li className="flex items-center justify-between gap-2 rounded-lg bg-background/70 px-2 py-1.5 ring-1 ring-border/50 dark:bg-background/45">
            <span className="text-muted-foreground">{te("Persona", "Person")}</span>
            <Link
              href={`/profile/${encodeURIComponent(topPerson.user_id)}`}
              className="inline-flex min-w-0 items-center gap-1 font-semibold text-foreground hover:text-primary"
            >
              <span className="truncate">{topPerson.username || topPerson.user_id.slice(0, 8)}</span>
              <ChevronRight className="size-3 shrink-0 opacity-60" aria-hidden />
            </Link>
          </li>
        ) : (
          <li className="rounded-lg px-2 py-1 text-muted-foreground">
            {loading ? "…" : te("Sin sugerencias de personas aún", "No people suggestions yet")}
          </li>
        )}
        {topEvent ? (
          <li className="flex items-center justify-between gap-2 rounded-lg bg-background/70 px-2 py-1.5 ring-1 ring-border/50 dark:bg-background/45">
            <span className="text-muted-foreground">{te("Evento", "Event")}</span>
            <Link
              href={`/events/${encodeURIComponent(topEvent.event_id)}`}
              className="inline-flex min-w-0 items-center gap-1 font-semibold text-foreground hover:text-primary"
            >
              <span className="truncate">{topEvent.title}</span>
              <ChevronRight className="size-3 shrink-0 opacity-60" aria-hidden />
            </Link>
          </li>
        ) : null}
        {topGroup ? (
          <li className="flex items-center justify-between gap-2 rounded-lg bg-background/70 px-2 py-1.5 ring-1 ring-border/50 dark:bg-background/45">
            <span className="text-muted-foreground">{te("Grupo", "Group")}</span>
            <Link
              href={`/groups/${encodeURIComponent(topGroup.group_id)}`}
              className="inline-flex min-w-0 items-center gap-1 font-semibold text-foreground hover:text-primary"
            >
              <span className="truncate">{topGroup.name}</span>
              <ChevronRight className="size-3 shrink-0 opacity-60" aria-hidden />
            </Link>
          </li>
        ) : null}
        {topFd ? (
          <li className="flex items-center justify-between gap-2 rounded-lg bg-background/70 px-2 py-1.5 ring-1 ring-border/50 dark:bg-background/45">
            <span className="text-muted-foreground">{te("Fast Date", "Fast Date")}</span>
            <Link href="/events" className="inline-flex min-w-0 items-center gap-1 font-semibold text-foreground hover:text-primary">
              <span className="truncate">{topFd.title}</span>
              <ChevronRight className="size-3 shrink-0 opacity-60" aria-hidden />
            </Link>
          </li>
        ) : null}
      </ul>
    </section>
  )
}
