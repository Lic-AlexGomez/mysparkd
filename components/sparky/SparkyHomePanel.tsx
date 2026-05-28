"use client"

import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { MessageCircle, Share2, Sparkles, X } from "lucide-react"
import { SparkyCharacterWeb } from "@/components/sparky/SparkyCharacterWeb"
import { SparkyThoughtBubble } from "@/components/sparky/SparkyThoughtBubble"
import { SPARKY_ALIVE, pickAliveLine } from "@/lib/sparky-alive-copy"
import type { SparkyGaze } from "@/lib/hooks/use-sparky-gaze-web"
import type { CompanionId } from "@/lib/companion/catalog"
import type { SparkyExpression } from "@/components/sparky/sparky-types"

type SparkyHomePanelProps = {
  open: boolean
  onClose: () => void
  bondPoints: number
  expression: SparkyExpression
  companionId: CompanionId
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

export function SparkyHomePanel({
  open,
  onClose,
  bondPoints,
  expression,
  companionId,
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
  const isSleepy = expression === "sleepy"
  const isHappy = expression === "happy" || expression === "excited" || expression === "celebrating"
  const whisper =
    whisperLoading ? pickAliveLine("thinking") : line ?? pickAliveLine(expression)

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            className="fixed inset-0 z-[61] bg-black/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-label="Cerrar"
          />
          <motion.div
            className="fixed bottom-0 right-0 z-[62] w-full max-w-md"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 26, stiffness: 280 }}
          >
            <div className="mx-3 mb-4 overflow-hidden rounded-[2.75rem] border border-primary/40 bg-gradient-to-b from-primary/25 via-card to-card shadow-2xl shadow-primary/25">
              <p className="pt-3 text-center text-[11px] font-extrabold uppercase tracking-widest text-primary">
                {SPARKY_ALIVE.homeTitle}
              </p>
              <div className="relative mx-3 mt-2 h-40 overflow-hidden rounded-[1.75rem] bg-gradient-to-b from-primary/15 to-transparent">
                <div className="absolute inset-x-0 bottom-0 h-1/2 rounded-t-3xl bg-primary/12" />
                <div
                  className={`absolute bottom-4 left-6 h-6 w-14 rounded-lg bg-secondary/30 transition-transform ${isSleepy ? "scale-y-125" : ""}`}
                />
                <div
                  className={`absolute bottom-11 right-10 h-2.5 w-2.5 rounded-full bg-accent transition-shadow ${isHappy ? "shadow-[0_0_16px_var(--accent)]" : "shadow-[0_0_8px_var(--accent)]"}`}
                />
                <div className="absolute bottom-6 left-1/2 h-28 w-28 -translate-x-1/2 rounded-full bg-primary/20 blur-2xl" />
                <motion.div
                  className="absolute bottom-2 left-1/2 -translate-x-1/2"
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <SparkyCharacterWeb
                    expression={expression}
                    companionId={companionId}
                    wardrobeAccessory={wardrobeAccessory}
                    size={92}
                    gaze={gaze}
                  />
                </motion.div>
              </div>

              <div className="flex items-center justify-between px-4 pt-1">
                <span className="text-xs font-extrabold tracking-wide text-cyan-400">
                  {SPARKY_ALIVE.bond(bondPoints)}
                </span>
                <button type="button" onClick={onClose} className="rounded-full p-1 text-muted-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {!whisperOpen ? (
                <p className="px-4 pb-2 text-lg font-semibold leading-snug">{whisper}</p>
              ) : null}

              {whisperOpen ? (
                <SparkyThoughtBubble
                  value={whisperValue}
                  onChange={onWhisperChange}
                  onSubmit={onWhisperSubmit}
                  loading={whisperLoading}
                  reply={whisperReply}
                />
              ) : null}

              <div className="flex flex-wrap gap-2 px-4 pb-4">
                <button
                  type="button"
                  onClick={onToggleWhisper}
                  onMouseEnter={(e) => {
                    const r = e.currentTarget.getBoundingClientRect()
                    lookAt?.(
                      ((r.left + r.width / 2) / window.innerWidth) * 2 - 1,
                      ((r.top + r.height / 2) / window.innerHeight) * 2 - 1
                    )
                  }}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold ${
                    whisperOpen ? "bg-primary/35 text-primary" : "bg-primary/20 text-primary"
                  }`}
                >
                  <MessageCircle className="h-4 w-4" />
                  susurrar
                </button>
                {onShare && !whisperOpen ? (
                  <button
                    type="button"
                    onClick={onShare}
                    onMouseEnter={(e) => {
                      const r = e.currentTarget.getBoundingClientRect()
                      lookAt?.(
                        ((r.left + r.width / 2) / window.innerWidth) * 2 - 1,
                        ((r.top + r.height / 2) / window.innerHeight) * 2 - 1
                      )
                    }}
                    className="rounded-full border p-2 text-muted-foreground"
                  >
                    <Share2 className="h-4 w-4" />
                  </button>
                ) : null}
                <Link
                  href="/companion"
                  className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground"
                  onMouseEnter={() => lookAt?.(0.5, -0.2)}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {SPARKY_ALIVE.changeForm}
                </Link>
              </div>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  )
}
