import { api } from '../api'
import type { DateCard, CreateDateCardRequest, MyDateCard, SentInterest } from '../types'

export const fastDateService = {
  async getFeed(filter?: Record<string, any>): Promise<DateCard[]> {
    return api.post<DateCard[]>('/api/date-cards/feed', filter || {})
  },

  async create(data: CreateDateCardRequest): Promise<void> {
    return api.post('/api/date-cards', data)
  },

  async update(id: string, data: Partial<CreateDateCardRequest>): Promise<void> {
    return api.put(`/api/date-cards/${id}`, data)
  },

  async delete(id: string): Promise<void> {
    return api.delete(`/api/date-cards/${id}`)
  },

  async getMine(): Promise<MyDateCard[]> {
    return api.get<MyDateCard[]>('/api/date-cards/my-cards')
  },

  async sendInterest(dateCardId: string, message?: string): Promise<void> {
    return api.post('/api/date-interests', { dateCardId, message })
  },

  async respondInterest(interestId: string, accept: boolean): Promise<{ chatId?: string } | null> {
    try {
      return await api.post<{ chatId?: string }>('/api/date-interests/respond', { interestId, accept })
    } catch {
      return null
    }
  },

  async getSentInterests(): Promise<SentInterest[]> {
    return api.get<SentInterest[]>('/api/date-interests/sent')
  },
}
