"use client"

import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { es, enUS } from "date-fns/locale"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { ChatContextResponse } from "@/lib/types/context-aware-chat"
import type { SupportedLanguage } from "@/lib/i18n"

function statusLabel(
  ctx: ChatContextResponse,
  te: (es: string, en: string) => string,
  lang: SupportedLanguage
): string {
  const loc = lang === "es" ? es : enUS
  const st = ctx.activity_status
  if (st === "LIVE") return te("En vivo", "Live")
  if (st === "UPCOMING") return te("Próximo", "Upcoming")
  if (st === "ACTIVE") return te("Activo", "Active")
  if (st === "ENDED") return te("Finalizado", "Ended")
  if (st === "COORDINATING") return te("Coordinando", "Coordinating")
  return te("Activo", "Active")
}

function peerHint(ctx: ChatContextResponse, te: (es: string, en: string) => string): string | null {
  switch (ctx.peer_activity) {
    case "IN_EVENT":
      return te("En un evento", "In an event")
    case "IN_FAST_DATE":
      return te("En Fast Date", "In Fast Date")
    case "IN_GROUP":
      return te("En actividad de grupo", "In group activity")
    case "NEARBY":
      return te("Cerca ahora", "Nearby now")
    default:
      return null
  }
}

export function ChatContextHeader({
  context,
  otherUsername,
  otherUserId,
  isTyping,
  otherUserOnline,
  otherUserLastSeen,
  te,
  language,
}: {
  context: ChatContextResponse | null
  otherUsername?: string
  otherUserId?: string
  isTyping: boolean
  otherUserOnline: boolean
  otherUserLastSeen: string | null
  te: (es: string, en: string) => string
  language: SupportedLanguage
}) {
  const loc = language === "es" ? es : enUS
  const title = context?.context_title || otherUsername || te("Chat", "Chat")
  const subParts: string[] = []
  if (context?.participant_count) {
    const n = context.participant_count
    subParts.push(
      te(`${n} ${n === 1 ? "persona" : "personas"}`, `${n} ${n === 1 ? "person" : "people"}`)
    )
  }
  if (context) subParts.push(statusLabel(context, te, language))
  if (context?.location) subParts.push(context.location)
  const peer = context ? peerHint(context, te) : null

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
      <p className="truncate text-sm font-bold leading-tight text-foreground md:text-base">{title}</p>
      {otherUserId ? (
        <Link
          href={`/profile/${otherUserId}`}
          className="truncate text-xs font-medium text-primary hover:underline"
        >
          {te("Con", "With")} @{otherUsername || "…"}
        </Link>
      ) : null}
      {subParts.length > 0 ? (
        <p className="truncate text-[11px] text-muted-foreground md:text-xs">{subParts.join(" · ")}</p>
      ) : null}
      {isTyping ? (
        <p className="text-xs text-primary flex items-center gap-1">
          <span className="flex gap-0.5">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
          </span>
          {te("escribiendo…", "typing…")}
        </p>
      ) : otherUserOnline ? (
        <p className="text-xs text-green-500 flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          {te("En línea", "Online")}
          {peer ? <span className="text-muted-foreground">· {peer}</span> : null}
        </p>
      ) : otherUserLastSeen ? (
        <p className="text-xs text-muted-foreground">
          {te("Visto", "Seen")}{" "}
          {formatDistanceToNow(new Date(otherUserLastSeen), { addSuffix: true, locale: loc })}
          {peer ? <span> · {peer}</span> : null}
        </p>
      ) : peer ? (
        <p className="text-xs text-muted-foreground">{peer}</p>
      ) : null}
    </div>
  )
}

export function ChatContextHeaderAvatar({
  otherUserPhoto,
  otherUsername,
}: {
  otherUserPhoto?: string
  otherUsername?: string
}) {
  return (
    <Avatar className="h-10 w-10 shrink-0 border-2 border-primary/30 ring-2 ring-primary/10">
      <AvatarImage src={otherUserPhoto} alt={otherUsername} />
      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-bold">
        {otherUsername?.[0]?.toUpperCase() || "?"}
      </AvatarFallback>
    </Avatar>
  )
}
