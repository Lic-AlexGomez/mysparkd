import { api } from "@/lib/api"
import type { Message } from "@/lib/types"

export type MessagePinEvent =
  | { type: "MESSAGE_PINNED"; message: Message }
  | { type: "MESSAGE_UNPINNED"; messageId: string; chatId: string }

class PrivateChatPinnedService {
  list(chatId: string): Promise<Message[]> {
    return api.get<Message[]>(`/api/messages/${chatId}/pinned`)
  }

  pin(messageId: string): Promise<Message> {
    return api.post<Message>(`/api/messages/messages/${messageId}/pin`)
  }

  unpin(messageId: string): Promise<void> {
    return api.delete<void>(`/api/messages/messages/${messageId}/pin`)
  }
}

export const privateChatPinnedService = new PrivateChatPinnedService()
