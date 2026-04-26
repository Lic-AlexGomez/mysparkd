import { api } from '../api'
import type { DateCard, CreateDateCardRequest, MyDateCard, SentInterest } from '../types'

export interface FeedFilter {
  maxDistanceKm?: number
  minAge?: number
  maxAge?: number
  minCompatibility?: number
  beforeDateTime?: string
  expiresBefore?: string
}

export const fastDateService = {
  async getFeed(filter?: FeedFilter): Promise<DateCard[]> {
    // El backend usa GET con @ModelAttribute (query params)
    const params = new URLSearchParams()
    if (filter?.maxDistanceKm) params.set('maxDistanceKm', String(filter.maxDistanceKm))
    if (filter?.minAge) params.set('minAge', String(filter.minAge))
    if (filter?.maxAge) params.set('maxAge', String(filter.maxAge))
    if (filter?.minCompatibility) params.set('minCompatibility', String(filter.minCompatibility))
    if (filter?.beforeDateTime) params.set('beforeDateTime', filter.beforeDateTime)
    if (filter?.expiresBefore) params.set('expiresBefore', filter.expiresBefore)
    const qs = params.toString()
    return api.get<DateCard[]>(`/api/date-cards/feed${qs ? '?' + qs : ''}`)
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

  async respondInterest(interestId: string, accept: boolean): Promise<{ chatId?: string }> {
    return api.post<{ chatId?: string }>('/api/fast-date/interests/respond', { interestId, accept })
  },

  async getSentInterests(): Promise<SentInterest[]> {
    return api.get<SentInterest[]>('/api/fast-date/interests/mine/sent')
  },
}
