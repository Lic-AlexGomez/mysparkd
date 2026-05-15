"use client"

import type { ChatContextResponse } from "@/lib/types/context-aware-chat"

export function ChatContextQuickReplies({
  context,
  onPick,
  te,
}: {
  context: ChatContextResponse | null
  onPick: (text: string) => void
  te: (es: string, en: string) => string
}) {
  if (!context?.quick_replies?.length) return null
  return (
    <div className="flex-shrink-0 border-t border-primary/10 bg-background/95 px-2 py-1.5">
      <p className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {te("Respuestas rápidas", "Quick replies")}
      </p>
      <div className="flex gap-1 overflow-x-auto pb-1 [scrollbar-width:thin]">
        {context.quick_replies.map((q, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onPick(q)}
            className="shrink-0 rounded-full border border-primary/25 bg-primary/5 px-2.5 py-1 text-[11px] text-foreground hover:bg-primary/15"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  )
}
