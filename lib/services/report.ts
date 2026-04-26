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

/** Backend puede devolver un arreglo plano o un objeto paginado (p. ej. `content`). */
function extractReportRows(raw: unknown): unknown[] {
  if (raw == null) return []
  if (Array.isArray(raw)) return raw
  if (typeof raw === 'object') {
    const o = raw as Record<string, unknown>
    for (const key of ['content', 'reports', 'data', 'items'] as const) {
      const v = o[key]
      if (Array.isArray(v)) return v
    }
  }
  return []
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

  /**
   * Lista reportes para moderación/admin.
   * Orden: historial completo → cola pendiente (moderador) → admin legado vía proxy.
   * Si ningún endpoint responde correctamente, lanza el último error (no se confunde con “sin datos”).
   */
  async listAdminReports(): Promise<ModerationReport[]> {
    const endpoints = [
      '/moderator/reports/all',
      '/moderator/reports',
      '/api/admin/reports',
    ] as const
    let lastError: unknown
    for (const path of endpoints) {
      try {
        const raw = await api.get<unknown>(path)
        const rows = extractReportRows(raw)
        return rows.map((row) => normalizeReport(row)).filter((r) => r.id.length > 0)
      } catch (e) {
        lastError = e
      }
    }
    if (lastError instanceof Error) throw lastError
    throw new Error('No se pudieron cargar los reportes')
  },

  async resolveAdminReport(reportId: string): Promise<void> {
    try {
      await api.post(`/moderator/reports/${reportId}/disable`)
    } catch {
      await api.post(`/api/admin/reports/${reportId}/resolve`)
    }
  },

  async dismissAdminReport(reportId: string): Promise<void> {
    try {
      await api.post(`/moderator/reports/${reportId}/dismiss`)
    } catch {
      await api.post(`/api/admin/reports/${reportId}/dismiss`)
    }
  },
}
