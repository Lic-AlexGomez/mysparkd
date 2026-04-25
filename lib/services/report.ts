import { api } from '@/lib/api'

export type ReportTargetType = 'POST' | 'USER' | 'MESSAGE' | 'COMMENT'

export interface CreateReportPayload {
  reportedUserId: string
  targetId: string
  targetType: ReportTargetType
  reasonId: string
  description?: string
}

export interface ReportReason {
  id: string
  name: string
}

export interface ModerationReport {
  id: string
  reporterUsername: string
  reporterId: string
  reportedUsername: string
  reportedId: string
  targetId: string
  targetType: string
  reasonName: string
  description: string
  status: string
  createdAt: string
}

export const reportService = {
  async getReasons(): Promise<ReportReason[]> {
    return await api.get<ReportReason[]>('/api/reports/reasons')
  },

  async createReport(payload: CreateReportPayload): Promise<void> {
    await api.post('/api/reports', payload)
  },

  async listAdminReports(): Promise<ModerationReport[]> {
    return await api.get<ModerationReport[]>('/api/admin/reports')
  },

  async resolveAdminReport(reportId: string): Promise<void> {
    await api.post(`/api/admin/reports/${reportId}/resolve`)
  },

  async dismissAdminReport(reportId: string): Promise<void> {
    await api.post(`/api/admin/reports/${reportId}/dismiss`)
  },
}
