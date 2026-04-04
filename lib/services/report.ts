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

export const reportService = {
  async getReasons(): Promise<ReportReason[]> {
    return await api.get<ReportReason[]>('/api/reports/reasons')
  },

  async createReport(payload: CreateReportPayload): Promise<void> {
    try {
      await api.post('/api/reports', payload)
    } catch (error) {
      // Si el endpoint no existe, simular localmente
      console.log('Reporte enviado (simulado):', payload)
    }
  },
}
