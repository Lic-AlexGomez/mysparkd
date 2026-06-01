"use client"

import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { Heart, MessageCircle, Share2, Sparkles, X } from "lucide-react"
import { SparkyRinconSceneWeb } from "@/components/sparky/SparkyRinconSceneWeb"
import { SparkyThoughtBubble } from "@/components/sparky/SparkyThoughtBubble"
import { SPARKY_ALIVE, pickAliveLine } from "@/lib/sparky-alive-copy"
import { getSparkBond } from "@/lib/sparky-bond"
import { useStableSparkyLine } from "@/lib/sparky-line-pacing"
import type { SparkyGaze } from "@/lib/hooks/use-sparky-gaze-web"
import type { CompanionId } from "@/lib/companion/catalog"
import type { SparkyExpression } from "@/components/sparky/sparky-types"

type SparkyHomePanelProps = {
  open: boolean
  onClose: () => void
  bondPoints: number
  expression: SparkyExpression
  companionId: CompanionId
  avatarStyle?: string | null
  wardrobeAccessory?: string | null
  line?: string
  gaze: SparkyGaze
  lookAt?: (x: number, y: number) => void
  whisperOpen: boolean
  onToggleWhisper: () => void
  whisperValue: string
  onWhisperChange: (value: string) => void
  onWhisperSubmit: () => void
  whisperLoading?: boolean
  whisperReply?: string | null
  onShare?: () => void
}

function lookAtElement(element: HTMLElement, lookAt?: (x: number, y: number) => void) {
  const rect = element.getBoundingClientRect()
  lookAt?.(
    ((rect.left + rect.width / 2) / window.innerWidth) * 2 - 1,
    ((rect.top + rect.height / 2) / window.innerHeight) * 2 - 1
  )
}

export function SparkyHomePanel({
  open,
  onClose,
  bondPoints,
  expression,
  companionId,
  avatarStyle,
  wardrobeAccessory,
  line,
  gaze,
  lookAt,
  whisperOpen,
  onToggleWhisper,
  whisperValue,
  onWhisperChange,
  onWhisperSubmit,
  whisperLoading = false,
  whisperReply,
  onShare,
}: SparkyHomePanelProps) {
  const fallbackLine = pickAliveLine(expression)
  const preferredLine = whisperLoading ? pickAliveLine("thinking") : line ?? null
  const whisper = useStableSparkyLine(preferredLine, fallbackLine)
  const bondValue = Math.min(100, Math.max(0, bondPoints))
  const bond = getSparkBond({ bondPoints } as import("@/lib/sparky-memory").SparkyMemory)
  const isSleepy = expression === "sleepy"
  const isHappy = expression === "happy" || expression === "excited" || expression === "celebrating"

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            className="fixed inset-0 z-[61] bg-black/45 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-label="Cerrar Sparky"
          />
          <motion.aside
            className="fixed bottom-0 right-0 z-[62] w-full max-w-[440px] p-3 sm:p-4"
            initial={{ y: "104%", opacity: 0.8 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "104%", opacity: 0.8 }}
            transition={{ type: "spring", damping: 28, stiffness: 290 }}
            aria-label="Mi rinconcito"
          >
            <div className="max-h-[calc(100vh-1.5rem)] overflow-y-auto rounded-[28px] border border-white/10 bg-card/92 shadow-2xl shadow-black/35 backdrop-blur-2xl">
              <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-white/20" aria-hidden />

              <div className="flex items-center justify-between gap-3 px-4 pt-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-200/80" aria-hidden />
                    <p className="truncate text-[11px] font-extrabold uppercase tracking-[0.18em] text-cyan-200/90">
                      {SPARKY_ALIVE.homeTitle}
                    </p>
                    <span className="h-1.5 w-1.5 rounded-full bg-fuchsia-200/80" aria-hidden />
                  </div>
                  <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-gradient-to-r from-cyan-400/15 to-fuchsia-400/10 px-3 py-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-amber-200" aria-hidden />
                    <p className="truncate text-xs font-bold text-foreground">
                      {bond.label} · {SPARKY_ALIVE.bond(bondPoints)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  title="Cerrar"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-white/10 hover:text-foreground"
                  aria-label="Cerrar"
                >
                  <X className="h-[18px] w-[18px]" />
                </button>
              </div>

              <SparkyRinconSceneWeb
                expression={expression}
                companionId={companionId}
                avatarStyle={avatarStyle}
                wardrobeAccessory={wardrobeAccessory}
                gaze={gaze}
                speaking={whisperLoading || expression === "speaking"}
                isSleepy={isSleepy}
                isHappy={isHappy}
              />

              <div className="px-4">
                <div
                  className="h-2 overflow-hidden rounded-full bg-white/10"
                  role="progressbar"
                  aria-label="Chispa de Sparky"
                  aria-valuenow={bondValue}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-rose-200 via-amber-200 to-cyan-200"
                    style={{ width: `${bondValue}%` }}
                  />
                </div>

                {!whisperOpen ? (
                  <div className="mt-4 rounded-[22px] bg-white/[0.06] px-4 py-3">
                    <p className="text-lg font-semibold leading-snug text-foreground">{whisper}</p>
                  </div>
                ) : null}
              </div>

              {whisperOpen ? (
                <SparkyThoughtBubble
                  value={whisperValue}
                  onChange={onWhisperChange}
                  onSubmit={onWhisperSubmit}
                  loading={whisperLoading}
                  reply={whisperReply}
                />
              ) : null}

              <div className="grid grid-cols-[1fr_auto_auto] items-center gap-2 px-4 pb-4 pt-3">
                <button
                  type="button"
                  onClick={onToggleWhisper}
                  onMouseEnter={(event) => lookAtElement(event.currentTarget, lookAt)}
                  className="inline-flex h-11 min-w-0 items-center justify-center gap-2 rounded-[16px] bg-rose-200 px-3 text-sm font-bold text-slate-950 shadow-[0_14px_34px_rgba(251,113,133,0.18)] transition hover:bg-amber-200"
                >
                  <MessageCircle className="h-4 w-4 shrink-0" aria-hidden />
                  <span className="truncate">{whisperOpen ? "Cerrar" : "Hablar"}</span>
                </button>
                {onShare && !whisperOpen ? (
                  <button
                    type="button"
                    title="Compartir"
                    onClick={onShare}
                    onMouseEnter={(event) => lookAtElement(event.currentTarget, lookAt)}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-white/8 text-foreground transition hover:bg-white/12"
                    aria-label="Compartir frase"
                  >
                    <Share2 className="h-4 w-4" />
                  </button>
                ) : null}
                <Link
                  href="/companion"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-white/8 text-foreground transition hover:bg-white/12"
                  onMouseEnter={(event) => lookAtElement(event.currentTarget, lookAt)}
                  title={SPARKY_ALIVE.changeForm}
                  aria-label={SPARKY_ALIVE.changeForm}
                >
                  <Sparkles className="h-4 w-4" />
                </Link>
              </div>

              <div className="flex items-center justify-center gap-2 px-4 pb-4 text-xs font-semibold text-muted-foreground">
                <Heart className="h-3.5 w-3.5 text-rose-200" aria-hidden />
                <span>cerquita de ti</span>
              </div>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  )
}
