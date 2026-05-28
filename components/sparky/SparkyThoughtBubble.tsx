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
    <div className="relative mx-4 mb-3 flex flex-col items-center">
      <div
        className="h-0 w-0 border-x-[10px] border-t-[12px] border-x-transparent border-t-primary/25"
        aria-hidden
      />
      <div className="w-full rounded-3xl border border-primary/35 bg-primary/10 p-3 shadow-lg shadow-primary/15">
        <p className="mb-2 text-xs font-bold tracking-wide text-primary">{SPARKY_ALIVE.chatPlaceholder}</p>
        {reply ? <p className="mb-2 text-sm font-semibold leading-snug">{reply}</p> : null}
        <div className="flex gap-2">
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSubmit()
            }}
            placeholder="…"
            disabled={loading}
            className="h-10 flex-1 rounded-full border border-primary/25 bg-background/80 px-4 text-sm outline-none focus:ring-2 focus:ring-primary/40"
          />
          <button
            type="button"
            onClick={onSubmit}
            disabled={loading || !value.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-40"
            aria-label="Enviar"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  )
}
