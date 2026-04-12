import { api } from '../api'
import type { DateCard, CreateDateCardRequest, MyDateCard, SentInterest } from '../types'

export const fastDateService = {
  async getFeed(): Promise<DateCard[]> {
    return api.get<DateCard[]>('/api/date-cards/feed')
  },

  async create(data: CreateDateCardRequest): Promise<void> {
    return api.post('/api/date-cards/create', data)
  },

  async update(id: string, data: Partial<CreateDateCardRequest>): Promise<void> {
    return api.put(`/api/date-cards/${id}`, data)
  },

  async delete(id: string): Promise<void> {
    return api.delete(`/api/date-cards/${id}`)
  },

  async getMine(): Promise<MyDateCard[]> {
    return api.get<MyDateCard[]>('/api/date-cards/mine')
  },

  async sendInterest(dateCardId: string, message?: string): Promise<void> {
    return api.post('/api/fast-date/interests/interested', { dateCardId, message })
  },

  async respondInterest(interestId: string, accept: boolean): Promise<void> {
    return api.post('/api/fast-date/interests/respond', { interestId, accept })
  },

  async getSentInterests(): Promise<SentInterest[]> {
    return api.get<SentInterest[]>('/api/fast-date/interests/mine/sent')
  },
}
