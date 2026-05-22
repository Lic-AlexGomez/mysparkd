import { api } from "@/lib/api"
import { extractMessageRows, normalizeChatMessage } from "@/lib/chat-messages"
import type { Message } from "@/lib/types"

export type MessagePinEvent =
  | { type: "MESSAGE_PINNED"; message: Message }
  | { type: "MESSAGE_UNPINNED"; messageId: string; chatId: string }

class PrivateChatPinnedService {
  async list(chatId: string): Promise<Message[]> {
    const data = await api.get<unknown>(`/api/messages/${encodeURIComponent(chatId)}/pinned`)
    return extractMessageRows(data).map((row) => normalizeChatMessage(row))
  }

  async pin(messageId: string): Promise<Message> {
    const saved = await api.post<Record<string, unknown>>(
      `/api/messages/messages/${encodeURIComponent(messageId)}/pin`
    )
    return normalizeChatMessage(saved)
  }

  unpin(messageId: string): Promise<void> {
    return api.delete<void>(`/api/messages/messages/${messageId}/pin`)
  }
}

export const privateChatPinnedService = new PrivateChatPinnedService()
