import { api } from '../api'
import type { Chat, Message, SendMessageRequest } from '../types'

export const chatService = {
  /**
   * Obtener todos los chats del usuario
   */
  async getMyChats(): Promise<Chat[]> {
    return api.get<Chat[]>('/api/chat/chats')
  },

  /**
   * Abrir o crear un chat con otro usuario
   */
  async openChat(userId: string): Promise<Chat> {
    return api.post<Chat>(`/api/chat/open/${userId}`)
  },

  /**
   * Obtener mensajes de un chat
   */
  async getMessages(chatId: string): Promise<Message[]> {
    return api.get<Message[]>(`/api/chat/${chatId}/messages`)
  },

  /**
   * Enviar un mensaje
   */
  async sendMessage(data: SendMessageRequest): Promise<Message> {
    return api.post<Message>('/api/chat/send', data)
  },

  /**
   * Marcar chat como leído
   */
  async markChatAsRead(chatId: string): Promise<void> {
    return api.post<void>(`/api/chat/chats/${chatId}/read`)
  },

  /**
   * Abrir sesión de chat (para evitar notificaciones)
   */
  async openChatSession(chatId: string): Promise<void> {
    return api.post<void>(`/api/chat/chats/${chatId}/open`)
  },

  /**
   * Cerrar chat activo
   */
  async closeChatSession(): Promise<void> {
    return api.post<void>('/api/chat/chats/close')
  },

  /**
   * Subir archivo multimedia para chat
   */
  async uploadMedia(file: File): Promise<{ mediaUrl: string; mediaPublicId: string }> {
    const formData = new FormData()
    formData.append('file', file)
    
    return api.post<{ mediaUrl: string; mediaPublicId: string }>(
      '/api/chat/upload/media',
      formData
    )
  }
}
