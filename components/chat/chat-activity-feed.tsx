"use client"

import { useEffect, useState } from "react"
import { Radio } from "lucide-react"
import { contextAwareChatService } from "@/lib/services/context-aware-chat"
import type { ChatActivityResponse } from "@/lib/types/context-aware-chat"
import { formatDistanceToNow } from "date-fns"
import { es, enUS } from "date-fns/locale"
import type { SupportedLanguage } from "@/lib/i18n"

export function ChatActivityFeed({
  chatId,
  search,
  language,
  te,
}: {
  chatId: string
  search: string
  language: SupportedLanguage
  te: (es: string, en: string) => string
}) {
  const [data, setData] = useState<ChatActivityResponse | null>(null)
  const loc = language === "es" ? es : enUS

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await contextAwareChatService.getActivity(chatId, search)
        if (!cancelled) setData(res)
      } catch {
        if (!cancelled) setData(null)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [chatId, search])

  if (!data?.entries?.length) return null

  return (
    <div className="flex-shrink-0 border-b border-primary/15 bg-muted/30 px-3 py-2">
      <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        <Radio className="size-3 text-primary" aria-hidden />
        {te("Actividad del hilo", "Thread activity")}
      </div>
      <p className="mb-2 text-[11px] text-primary/90">{data.active_in_chat_hint}</p>
      <ul className="max-h-24 space-y-1 overflow-y-auto text-[11px] text-muted-foreground">
        {data.entries.slice(0, 6).map((e) => (
          <li key={e.id} className="flex gap-2 border-l-2 border-primary/25 pl-2">
            <span className="shrink-0 text-[10px] opacity-70">
              {formatDistanceToNow(new Date(e.occurred_at), { addSuffix: true, locale: loc })}
            </span>
            <span className="min-w-0 leading-snug">{e.text}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
