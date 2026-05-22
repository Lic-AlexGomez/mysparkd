import { api } from '../api'
import { extractApiRows } from '../extract-api-rows'
import { extractMessageRows, normalizeChatMessage } from '../chat-messages'
import type { Chat, Message, SendMessageRequest } from '../types'

const MESSAGES_BASE = '/api/messages'

export const chatService = {
  async getMyChats(): Promise<Chat[]> {
    const raw = await api.get<unknown>('/api/chat/chats')
    const rows = extractApiRows<Chat & { id?: string }>(raw)
    return rows.map((c) => {
      const row = c as Chat & { id?: string }
      return {
        ...row,
        chatId: String(row.chatId ?? row.id ?? ''),
      }
    })
  },

  async setChatCategory(chatId: string, category: 'DIRECT' | 'GENERAL'): Promise<void> {
    await api.patch<void>(
      `/api/chat/chats/${encodeURIComponent(chatId)}/category?category=${encodeURIComponent(category)}`
    )
  },

  async openChat(userId: string): Promise<Chat> {
    const chat = await api.post<Chat & { id?: string }>(`/api/chat/open/${userId}`)
    return { ...chat, chatId: String(chat.chatId ?? chat.id ?? '') }
  },

  async getMessages(chatId: string, page = 0, size = 50): Promise<Message[]> {
    const data = await api.get<unknown>(
      `${MESSAGES_BASE}/${encodeURIComponent(chatId)}/messages?page=${page}&size=${size}`
    )
    return extractMessageRows(data).map((row) => normalizeChatMessage(row))
  },

  async sendMessageMultipart(formData: FormData): Promise<Message> {
    const saved = await api.post<Record<string, unknown>>(`${MESSAGES_BASE}/send`, formData)
    return normalizeChatMessage(saved)
  },

  async sendMessage(data: SendMessageRequest): Promise<Message> {
    const formData = new FormData()
    formData.append('message', JSON.stringify(data))
    return this.sendMessageMultipart(formData)
  },

  async markChatAsRead(chatId: string): Promise<void> {
    return api.post<void>(`/api/chat/chats/${chatId}/read`)
  },

  async openChatSession(chatId: string): Promise<void> {
    return api.post<void>(`/api/chat/chats/${chatId}/open`)
  },

  async closeChatSession(): Promise<void> {
    return api.post<void>('/api/chat/chats/close')
  },

  async uploadMedia(file: File): Promise<{ mediaUrl: string; mediaPublicId: string }> {
    const formData = new FormData()
    formData.append('file', file)
    return api.post<{ mediaUrl: string; mediaPublicId: string }>(
      `${MESSAGES_BASE}/upload/media`,
      formData
    )
  },
}
