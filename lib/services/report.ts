interface Report {
  id: string
  reporterId: string
  targetId: string
  targetType: 'user' | 'post' | 'message'
  reason: string
  status: 'pending' | 'confirmed' | 'rejected'
  createdAt: string
}

class ReportService {
  private reports: Report[] = []

  constructor() {
    this.loadReports()
  }

  private loadReports() {
    const saved = localStorage.getItem('sparkd_reports')
    if (saved) {
      this.reports = JSON.parse(saved)
    }
  }

  private saveReports() {
    localStorage.setItem('sparkd_reports', JSON.stringify(this.reports))
  }

  createReport(
    reporterId: string,
    targetId: string,
    targetType: 'user' | 'post' | 'message',
    reason: string
  ): Report {
    const report: Report = {
      id: `rep_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      reporterId,
      targetId,
      targetType,
      reason,
      status: 'pending',
      createdAt: new Date().toISOString(),
    }
    this.reports.push(report)
    this.saveReports()
    return report
  }

  getUserReports(userId: string): Report[] {
    return this.reports.filter(r => r.targetId === userId)
  }
}

export const reportService = new ReportService()
