import { api } from '@/lib/api'
import type { PrivacySettings, SparklingListMember } from '@/lib/types'

export const privacyService = {
  getSettings: () => api.get<PrivacySettings>('/api/settings/privacy'),

  updateSettings: (settings: PrivacySettings) =>
    api.put<PrivacySettings>('/api/settings/privacy', settings),

  getSparklingList: () => api.get<SparklingListMember[]>('/api/settings/sparkling-list'),

  addToSparklingList: (memberId: string) =>
    api.post<void>(`/api/settings/sparkling-list/${memberId}`),

  removeFromSparklingList: (memberId: string) =>
    api.delete<void>(`/api/settings/sparkling-list/${memberId}`),
}
