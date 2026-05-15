"use client"

import { useCallback, useMemo, useState } from "react"
import { BarChart3, MapPin, Sparkles, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { EventChatPhase } from "@/lib/services/pre-event-chat"

export interface PreEventChatHubProps {
  te: (es: string, en: string) => string
  phase: EventChatPhase
  /** Meetup spot label (official / zone). */
  venueLabel?: string | null
  approvedRsvpCount: number
  pendingInterestCount: number
  inChatMemberCount: number
  moderatorCount: number
  maxGuests?: number
  onInsertPrompt: (text: string) => void
  canHostPresetPolls: boolean
  onPresetPoll: (question: string, options: string[]) => void | Promise<void>
}

export function PreEventChatHub({
  te,
  phase,
  venueLabel,
  approvedRsvpCount,
  pendingInterestCount,
  inChatMemberCount,
  moderatorCount,
  maxGuests,
  onInsertPrompt,
  canHostPresetPolls,
  onPresetPoll,
}: PreEventChatHubProps) {
  const [presetBusyKey, setPresetBusyKey] = useState<string | null>(null)

  const icebreakers = useMemo(
    () =>
      [
        te("¿Qué te trajo a este plan?", "What drew you to this plan?"),
        te("¿Primera vez en algo así?", "First time at something like this?"),
        te("¿Venís solo/a o con alguien?", "Flying solo or bringing someone?"),
        te("¿Algún tip para llegar al lugar?", "Any tips for getting to the spot?"),
      ] as const,
    [te]
  )

  const presetPolls = useMemo(
    () =>
      [
        {
          key: "arrival",
          question: te("¿A qué hora llegás?", "What time are you going?"),
          options: [
            te("Temprano", "Early"),
            te("A horario", "On time"),
            te("Un poco más tarde", "A bit late"),
          ],
        },
        {
          key: "transport",
          question: te("¿Cómo te movés?", "How are you getting there?"),
          options: [
            te("Caminando / bici", "Walk / bike"),
            te("Transporte público", "Transit"),
            te("Auto / rideshare", "Car / rideshare"),
          ],
        },
        {
          key: "confirm",
          question: te("¿Confirmás asistencia?", "Can you confirm you are coming?"),
          options: [te("Sí", "Yes"), te("Todavía no sé", "Still unsure"), te("No puedo", "Can't make it")],
        },
      ] as const,
    [te]
  )

  const phaseLabel =
    phase === "pre"
      ? te("Antes del encuentro — conectá primero", "Before the meetup — connect early")
      : phase === "during"
        ? te("El plan está en marcha", "The meetup is underway")
        : te("Después del evento — chat en archivo (solo lectura próximamente)", "Post-event — archive chat (read-only coming soon)")

  const runPreset = useCallback(
    async (key: string, question: string, options: readonly string[]) => {
      const opts = [...options]
      if (opts.length < 2) return
      setPresetBusyKey(key)
      try {
        await onPresetPoll(question, opts)
      } finally {
        setPresetBusyKey(null)
      }
    },
    [onPresetPoll]
  )

  const capHint =
    maxGuests && maxGuests > 0
      ? te(`${approvedRsvpCount}/${maxGuests} cupos`, `${approvedRsvpCount}/${maxGuests} spots`)
      : te(`${approvedRsvpCount} confirmados`, `${approvedRsvpCount} confirmed`)

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.07] via-card to-secondary/[0.06] p-4 shadow-sm ring-1 ring-black/[0.04] dark:from-primary/[0.12] dark:via-card dark:to-secondary/[0.08] dark:ring-white/[0.06]"
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-2">
          <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-snug text-foreground">{te("Sala pre-evento", "Pre-event room")}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{phaseLabel}</p>
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 border-t border-border/50 pt-3 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5 font-medium text-foreground/90">
          <Users className="size-3.5 shrink-0 opacity-80" aria-hidden />
          {capHint}
        </span>
        <span>
          {te("En el chat:", "In chat:")} <strong className="text-foreground">{inChatMemberCount}</strong>
        </span>
        <span>
          {te("Interes pendiente:", "Interested (pending):")}{" "}
          <strong className="text-foreground">{pendingInterestCount}</strong>
        </span>
        <span>
          {te("Mods/host:", "Mods/host:")} <strong className="text-foreground">{moderatorCount}</strong>
        </span>
      </div>

      {venueLabel ? (
        <div className="mt-3 flex gap-2 rounded-xl border border-border/55 bg-background/55 px-3 py-2 text-xs leading-snug text-foreground backdrop-blur-sm dark:bg-background/30">
          <MapPin className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
          <div className="min-w-0">
            <p className="font-semibold text-[11px] uppercase tracking-wide text-muted-foreground">
              {te("Ubicación / coord.", "Location / coordination")}
            </p>
            <p className="mt-0.5 break-words">{venueLabel}</p>
          </div>
        </div>
      ) : null}

      <div className="mt-4 space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {te("Rompehielos", "Icebreakers")}
        </p>
        <div className="flex flex-wrap gap-2">
          {icebreakers.map((prompt, i) => (
            <Button
              key={i}
              type="button"
              variant="outline"
              size="sm"
              className="h-auto max-w-full shrink rounded-xl border-border/60 bg-background/70 px-3 py-1.5 text-left text-xs font-normal leading-snug whitespace-normal dark:bg-background/45"
              onClick={() => onInsertPrompt(prompt)}
              disabled={phase === "after"}
            >
              {prompt}
            </Button>
          ))}
        </div>
      </div>

      {canHostPresetPolls ? (
        <div className="mt-4 space-y-2">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            <BarChart3 className="size-3.5" aria-hidden />
            {te("Encuestas rápidas", "Quick polls")}
          </p>
          <div className="flex flex-wrap gap-2">
            {presetPolls.map((p) => (
              <Button
                key={p.key}
                type="button"
                size="sm"
                variant="secondary"
                className="h-9 shrink-0 rounded-xl font-semibold"
                disabled={phase === "after" || presetBusyKey !== null}
                onClick={() => void runPreset(p.key, p.question, p.options)}
              >
                {presetBusyKey === p.key ? te("Creando…", "Creating…") : p.question}
              </Button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
