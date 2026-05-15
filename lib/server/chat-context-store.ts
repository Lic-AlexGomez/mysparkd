import type {
  ChatActivityEntry,
  ChatActivityStatus,
  ContextAwareChatType,
  PeerActivityHint,
} from "@/lib/types/context-aware-chat"

export type StoredChatContext = {
  chat_type: ContextAwareChatType
  context_id: string | null
  context_title: string
  location: string | null
  activity_status: ChatActivityStatus
  participant_count: number
  peer_activity: PeerActivityHint
  updated_at: string
}

type GlobalCtx = {
  contexts: Map<string, StoredChatContext>
  activity: Map<string, ChatActivityEntry[]>
}
const g = globalThis as unknown as { __sparkd_chat_ctx__?: GlobalCtx }

function bucket(): GlobalCtx {
  if (!g.__sparkd_chat_ctx__) g.__sparkd_chat_ctx__ = { contexts: new Map(), activity: new Map() }
  return g.__sparkd_chat_ctx__
}

const MAX_ACTIVITY = 40

export function getChatContextStore(chatId: string): StoredChatContext | null {
  const id = String(chatId || "").trim()
  if (!id) return null
  return bucket().contexts.get(id) ?? null
}

export function setChatContextStore(chatId: string, patch: Partial<StoredChatContext> & Pick<StoredChatContext, "chat_type">): StoredChatContext {
  const id = String(chatId || "").trim()
  const prev = bucket().contexts.get(id)
  const next: StoredChatContext = {
    chat_type: patch.chat_type,
    context_id: patch.context_id ?? prev?.context_id ?? null,
    context_title: patch.context_title ?? prev?.context_title ?? "Chat",
    location: patch.location ?? prev?.location ?? null,
    activity_status: patch.activity_status ?? prev?.activity_status ?? "COORDINATING",
    participant_count: patch.participant_count ?? prev?.participant_count ?? 2,
    peer_activity: patch.peer_activity ?? prev?.peer_activity ?? "UNKNOWN",
    updated_at: new Date().toISOString(),
  }
  bucket().contexts.set(id, next)
  return next
}

export function appendChatActivity(chatId: string, entry: Omit<ChatActivityEntry, "id" | "occurred_at"> & { id?: string }): void {
  const id = String(chatId || "").trim()
  if (!id) return
  const row: ChatActivityEntry = {
    id: entry.id ?? `act-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    kind: entry.kind,
    text: entry.text,
    occurred_at: new Date().toISOString(),
  }
  const m = bucket()
  const arr = m.activity.get(id) ?? []
  arr.unshift(row)
  while (arr.length > MAX_ACTIVITY) arr.pop()
  m.activity.set(id, arr)
}

export function getChatActivity(chatId: string): ChatActivityEntry[] {
  const id = String(chatId || "").trim()
  if (!id) return []
  return [...(bucket().activity.get(id) ?? [])]
}
