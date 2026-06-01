"use client"

import { Loader2, Send } from "lucide-react"
import { SPARKY_ALIVE } from "@/lib/sparky-alive-copy"

type SparkyThoughtBubbleProps = {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  loading?: boolean
  reply?: string | null
}

export function SparkyThoughtBubble({
  value,
  onChange,
  onSubmit,
  loading = false,
  reply,
}: SparkyThoughtBubbleProps) {
  return (
    <div className="relative mx-4 mb-3">
      <form
        className="rounded-[22px] border border-white/10 bg-white/[0.07] p-3 shadow-lg shadow-black/20 backdrop-blur-xl"
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit()
        }}
      >
        <p className="mb-2 text-xs font-semibold text-foreground/70">{SPARKY_ALIVE.chatPlaceholder}</p>
        {reply ? (
          <p className="mb-2 rounded-[16px] bg-rose-100/10 px-3 py-2 text-sm font-semibold leading-snug text-foreground">
            {reply}
          </p>
        ) : null}
        <div className="flex gap-2">
          <input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Escribe bajito..."
            disabled={loading}
            className="h-10 min-w-0 flex-1 rounded-[14px] border border-white/10 bg-background/55 px-3 text-sm outline-none placeholder:text-muted-foreground focus:border-rose-200/60 focus:ring-2 focus:ring-rose-200/20 disabled:opacity-60"
          />
          <button
            title="Enviar"
            type="submit"
            disabled={loading || !value.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-rose-200 text-slate-950 shadow-[0_10px_28px_rgba(251,113,133,0.22)] transition hover:bg-amber-200 disabled:opacity-40"
            aria-label="Enviar"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </form>
    </div>
  )
}
