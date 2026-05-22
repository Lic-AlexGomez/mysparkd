import type { Message } from "@/lib/types"

/** Extrae filas de respuesta paginada Spring (`Page`) o array directo. */
export function extractMessageRows(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) return data as Record<string, unknown>[]
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>
    if (Array.isArray(obj.content)) return obj.content as Record<string, unknown>[]
  }
  return []
}

export function normalizeChatMessage(raw: Record<string, unknown>): Message {
  const id = raw.messageId ?? raw.id
  const idStr = id != null ? String(id) : ""
  const media = raw.media as Message["media"] | undefined
  let content = typeof raw.content === "string" ? raw.content : ""
  const mt = raw.mediaType as string | undefined
  if (!content && media?.mediaUrl) {
    if (mt === "IMAGE" || mt === "image") content = media.mediaUrl
    else if (mt === "VIDEO" || mt === "video") content = media.mediaUrl
    else if (mt === "AUDIO" || mt === "audio") content = `🎤 ${media.mediaUrl}`
    else content = media.mediaUrl
  }
  return {
    messageId: idStr,
    id: idStr,
    chatId: String(raw.chatId ?? ""),
    senderId: String(raw.senderId ?? ""),
    receiverId: String(raw.receiverId ?? ""),
    content,
    sentAt: String(raw.sentAt ?? new Date().toISOString()),
    mediaType: mt,
    media,
    read: Boolean(raw.read),
    edited: Boolean(raw.edited),
    editedAt: raw.editedAt as string | undefined,
    system: Boolean(raw.system),
    reactions: raw.reactions as Message["reactions"],
    pinnedAt: (raw.pinnedAt as string | null) ?? null,
  }
}

export function messageDisplayText(msg: Pick<Message, "content" | "media" | "mediaType">): string {
  const c = msg.content ?? ""
  if (c.startsWith("@reply:")) {
    return c.match(/@reply:[^|]+\|(.*)/)?.[1] ?? c
  }
  return c
}
