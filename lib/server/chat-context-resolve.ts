import type {
  ChatActivityStatus,
  ChatContextResponse,
  ContextAwareChatType,
  PeerActivityHint,
} from "@/lib/types/context-aware-chat"
import { appendChatActivity, getChatContextStore, setChatContextStore } from "@/lib/server/chat-context-store"

function parseCount(raw: string | null): number | undefined {
  if (!raw) return undefined
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? Math.min(50000, Math.floor(n)) : undefined
}

function inferPeerActivity(chatType: ContextAwareChatType): PeerActivityHint {
  switch (chatType) {
    case "EVENT":
      return "IN_EVENT"
    case "FAST_DATE":
      return "IN_FAST_DATE"
    case "GROUP":
      return "IN_GROUP"
    default:
      return "IN_APP"
  }
}

function defaultStatus(chatType: ContextAwareChatType): ChatActivityStatus {
  if (chatType === "EVENT") return "UPCOMING"
  if (chatType === "FAST_DATE") return "COORDINATING"
  if (chatType === "GROUP") return "ACTIVE"
  return "COORDINATING"
}

function quickRepliesFor(
  chatType: ContextAwareChatType,
  title: string,
  lang: "es" | "en"
): string[] {
  const es =
    chatType === "DIRECT"
      ? [
          "¿Te va cenar esta semana?",
          "Propongo un café cerca de ambos",
          "¿Quieres que reserve en…?",
        ]
      : chatType === "EVENT"
        ? [
            "Llego 10 min antes al punto de encuentro",
            "¿Alguien va en metro?",
            "Confirmo asistencia ✅",
          ]
        : chatType === "FAST_DATE"
          ? [
              "¿Te parece bien el sitio que puse?",
              "Podemos acortar a 20 min si prefieres",
              "Te aviso cuando salga de casa",
            ]
          : [
              "¿Sumamos a alguien más al plan?",
              "Propongo horario: ¿19:30?",
              "¿Hacemos poll rápido en el grupo?",
            ]

  const en =
    chatType === "DIRECT"
      ? [
          "Does dinner this week work for you?",
          "I suggest a coffee halfway between us",
          "Want me to book somewhere?",
        ]
      : chatType === "EVENT"
        ? [
            "I’ll arrive 10 min early at the meet spot",
            "Anyone taking the subway?",
            "Confirming I’m going ✅",
          ]
        : chatType === "FAST_DATE"
          ? [
              "Does the spot I picked work for you?",
              "Happy to keep it to 20 min if easier",
              "I’ll ping you when I head out",
            ]
          : [
              "Should we invite one more person?",
              "How about 7:30pm?",
              "Quick poll in the group?",
            ]

  void title
  return lang === "es" ? es : en
}

export function resolveChatContext(params: {
  chatId: string
  searchParams: URLSearchParams
}): ChatContextResponse {
  const chatId = String(params.chatId || "").trim()
  const q = params.searchParams
  const lang = (q.get("lang") || "es").toLowerCase().startsWith("en") ? "en" : "es"

  const eventId = q.get("eventId")?.trim() || q.get("event")?.trim() || ""
  const groupId = q.get("groupId")?.trim() || q.get("group")?.trim() || ""
  const fdId = q.get("fdId")?.trim() || q.get("fastDate")?.trim() || ""
  const titleQ = q.get("title")?.trim() || q.get("ctxTitle")?.trim() || ""
  const locQ = q.get("location")?.trim() || q.get("loc")?.trim() || ""
  const countQ = parseCount(q.get("count") || q.get("participants"))

  const stored = getChatContextStore(chatId)

  let chat_type: ContextAwareChatType = stored?.chat_type ?? "DIRECT"
  let context_id: string | null = stored?.context_id ?? null
  let context_title = stored?.context_title ?? (titleQ || "Conversation")
  let location: string | null = stored?.location ?? (locQ || null)
  let activity_status: ChatActivityStatus = stored?.activity_status ?? defaultStatus(chat_type)
  let participant_count = stored?.participant_count ?? countQ ?? 2
  let peer_activity: PeerActivityHint = stored?.peer_activity ?? inferPeerActivity(chat_type)

  if (eventId) {
    chat_type = "EVENT"
    context_id = eventId
    context_title = titleQ || context_title || "Event"
    activity_status = "UPCOMING"
    peer_activity = "IN_EVENT"
  } else if (groupId) {
    chat_type = "GROUP"
    context_id = groupId
    context_title = titleQ || context_title || "Group"
    activity_status = "ACTIVE"
    peer_activity = "IN_GROUP"
  } else if (fdId) {
    chat_type = "FAST_DATE"
    context_id = fdId
    context_title = titleQ || context_title || "Fast Date"
    activity_status = "COORDINATING"
    peer_activity = "IN_FAST_DATE"
  } else if (stored) {
    /* keep stored */
  } else {
    chat_type = "DIRECT"
    context_id = null
    context_title = titleQ || "Match chat"
    activity_status = "ACTIVE"
    peer_activity = "IN_APP"
    participant_count = countQ ?? 2
  }

  if (countQ != null) participant_count = countQ

  const res: ChatContextResponse = {
    chat_id: chatId,
    chat_type,
    context_id,
    context_title,
    location,
    activity_status,
    participant_count,
    peer_display_name: q.get("peer")?.trim() || null,
    peer_activity,
    quick_replies: quickRepliesFor(chat_type, context_title, lang),
    updated_at: new Date().toISOString(),
  }

  return res
}

export function applyLinkContext(
  chatId: string,
  body: {
    chat_type?: ContextAwareChatType
    context_id?: string | null
    context_title?: string
    location?: string | null
    activity_status?: ChatActivityStatus
    participant_count?: number
  }
): ChatContextResponse {
  const chat_type = body.chat_type ?? "DIRECT"
  const merged = setChatContextStore(chatId, {
    chat_type,
    context_id: body.context_id ?? null,
    context_title: body.context_title ?? "Chat",
    location: body.location ?? null,
    activity_status: body.activity_status ?? defaultStatus(chat_type),
    participant_count: body.participant_count ?? 2,
    peer_activity: inferPeerActivity(chat_type),
  })
  appendChatActivity(chatId, {
    kind: "system",
    text: `Context set: ${merged.context_title} (${merged.chat_type})`,
  })
  return {
    chat_id: chatId,
    chat_type: merged.chat_type,
    context_id: merged.context_id,
    context_title: merged.context_title,
    location: merged.location,
    activity_status: merged.activity_status,
    participant_count: merged.participant_count,
    peer_display_name: null,
    peer_activity: merged.peer_activity,
    quick_replies: quickRepliesFor(merged.chat_type, merged.context_title, "es"),
    updated_at: merged.updated_at,
  }
}
