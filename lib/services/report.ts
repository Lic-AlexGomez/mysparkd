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
    try {
      return await api.get<ReportReason[]>('/api/reports/reasons')
    } catch {
      // fallback con razones hardcodeadas si el endpoint no existe aún
      return [
        { id: '1', name: 'Spam' },
        { id: '2', name: 'Contenido inapropiado' },
        { id: '3', name: 'Acoso' },
        { id: '4', name: 'Violencia' },
        { id: '5', name: 'Perfil falso' },
        { id: '6', name: 'Otro' },
      ]
    }
  },

  async createReport(payload: CreateReportPayload): Promise<void> {
    await api.post('/api/reports', payload)
  },
}
