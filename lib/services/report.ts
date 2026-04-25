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

function normalizeReport(report: any): ModerationReport {
  return {
    id: String(report?.id ?? report?.reportId ?? report?.moderationReportId ?? ''),
    reporterUsername: report?.reporterUsername ?? report?.reporter?.username ?? report?.reportedByUsername ?? '',
    reporterId: String(report?.reporterId ?? report?.reporter?.id ?? report?.reportedById ?? ''),
    reportedUsername: report?.reportedUsername ?? report?.reportedUser?.username ?? report?.targetUsername ?? '',
    reportedId: String(report?.reportedId ?? report?.reportedUser?.id ?? report?.targetUserId ?? ''),
    targetId: String(report?.targetId ?? report?.entityId ?? ''),
    targetType: String(report?.targetType ?? report?.entityType ?? 'UNKNOWN'),
    reasonName: report?.reasonName ?? report?.reason?.name ?? report?.reason ?? 'Sin motivo',
    description: report?.description ?? '',
    status: String(report?.status ?? 'PENDING'),
    createdAt: report?.createdAt ?? new Date().toISOString(),
  }
}

export const reportService = {
  async getReasons(): Promise<ReportReason[]> {
    return await api.get<ReportReason[]>('/api/reports/reasons')
  },

  async createReport(payload: CreateReportPayload): Promise<void> {
    await api.post('/api/reports', payload)
  },

  async listAdminReports(): Promise<ModerationReport[]> {
    try {
      const rows = await api.get<any[]>('/moderator/reports/all')
      return (Array.isArray(rows) ? rows : []).map(normalizeReport)
    } catch {
      // Fallback seguro para entornos donde todavía existe el endpoint legado.
      try {
        const legacyRows = await api.get<any[]>('/api/admin/reports')
        return (Array.isArray(legacyRows) ? legacyRows : []).map(normalizeReport)
      } catch {
        return []
      }
    }
  },

  async resolveAdminReport(reportId: string): Promise<void> {
    await api.post(`/api/admin/reports/${reportId}/resolve`)
  },

  async dismissAdminReport(reportId: string): Promise<void> {
    await api.post(`/api/admin/reports/${reportId}/dismiss`)
  },
}
