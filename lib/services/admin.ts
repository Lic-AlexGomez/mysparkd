import { api } from "@/lib/api"
import type { AdminStats, UserGrowth } from "@/lib/types"

export type DailyPoint = { date: string; count: number }
export type RevenueDailyPoint = { date: string; amountCents: number; amountUsd: string }

export type AdminContentStats = {
  activePosts: number
  deletedPosts: number
  totalPosts: number
  postsWithMedia: number
  totalReports: number
  newPostsLastDays: number
  series: DailyPoint[]
}

export type AdminEngagementStats = {
  totalLikes: number
  totalDislikes: number
  totalSwipes: number
  totalMatches: number
  matchRateAllTimePct: number
  recentLikes: number
  recentDislikes: number
  recentMatches: number
  matchRateRecentPct: number
  funnel: {
    totalUsers: number
    usersWhoSwiped: number | string
    totalLikes: number
    totalMatches: number
  }
  likesSeries: DailyPoint[]
  matchesSeries: DailyPoint[]
}

export type AdminGeoStats = {
  totalUsers: number
  usersWithLocation: number
  usersWithoutLocation: number
  coveragePct: number
  byRegion: Array<{ region: string; count: number }>
}

export type AdminNotificationStats = {
  totalDeviceTokens: number
  usersWithPushEnabled: number
  totalUsers: number
  pushCoveragePct: number
}

export type FeatureFlagRow = {
  id: string
  name: string
  description?: string
  enabled: boolean
  rolloutPercent: number
  createdAt?: string
  updatedAt?: string
}

export type FeatureFlagInput = {
  name: string
  description?: string
  enabled: boolean
  rolloutPercent: number
}

export type BenchmarkRow = {
  id: number
  metric?: string
  value?: string | number
  source?: string
  notes?: string
  [k: string]: unknown
}

export type AuditLogRow = {
  id: string
  actorId?: string | null
  actorUsername?: string | null
  action: string
  targetType?: string | null
  targetId?: string | null
  detail?: string | null
  ipAddress?: string | null
  createdAt: string
}

export type AuditLogPage = {
  content: AuditLogRow[]
  totalPages: number
  totalElements: number
  number: number
}

export type AdminSystemHealth = {
  timestamp: string
  database?: { status?: string; product?: string; version?: string; error?: string }
  redis?: { status?: string; response?: string; error?: string }
  jvm?: {
    heapUsedMb?: number
    heapMaxMb?: number
    heapUsedPct?: number
    uptimeSeconds?: number
    javaVersion?: string
  }
}

const n = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0)
const s = (v: unknown) => (typeof v === "string" ? v : "")

const asDailySeries = (raw: unknown): DailyPoint[] => {
  if (!Array.isArray(raw)) return []
  return raw.map((it) => {
    const o = (it || {}) as Record<string, unknown>
    return { date: s(o.date), count: n(o.count) }
  })
}

export const adminService = {
  async getStats(): Promise<AdminStats | null> {
    try {
      return await api.get<AdminStats>("/api/admin/stats")
    } catch {
      try {
        return await api.get<AdminStats>("/admin/stats")
      } catch {
        return null
      }
    }
  },

  async getGrowth(): Promise<UserGrowth[]> {
    try {
      return await api.get<UserGrowth[]>("/api/admin/growth")
    } catch {
      try {
        return await api.get<UserGrowth[]>("/admin/growth")
      } catch {
        return []
      }
    }
  },

  async getMatchesDaily(days = 7): Promise<{ totalLastDays: number; totalAllTime: number; series: DailyPoint[] }> {
    const raw = await api.get<Record<string, unknown>>(`/api/admin/analytics/matches-daily?days=${days}`)
    return {
      totalLastDays: n(raw[`totalLast${days}Days`]),
      totalAllTime: n(raw.totalAllTime),
      series: asDailySeries(raw.series),
    }
  },

  async getRevenueDaily(): Promise<RevenueDailyPoint[]> {
    const raw = await api.get<Array<Record<string, unknown>>>("/api/admin/analytics/revenue-daily")
    if (!Array.isArray(raw)) return []
    return raw.map((row) => ({
      date: s(row.date),
      amountCents: n(row.amountCents),
      amountUsd: s(row.amountUsd),
    }))
  },

  async getContentStats(days = 30): Promise<AdminContentStats> {
    const raw = await api.get<Record<string, unknown>>(`/api/admin/analytics/content-stats?days=${days}`)
    return {
      activePosts: n(raw.activePosts),
      deletedPosts: n(raw.deletedPosts),
      totalPosts: n(raw.totalPosts),
      postsWithMedia: n(raw.postsWithMedia),
      totalReports: n(raw.totalReports),
      newPostsLastDays: n(raw[`newPostsLast${days}Days`]),
      series: asDailySeries(raw.series),
    }
  },

  getStripeMrr: () =>
    api.get<{
      mrrCents: number
      mrrUsd: string
      activePayingSubscriptions: number
      activeTrialSubscriptions: number
      pricePerMonthCents: number
      pricePerMonthUsd: string
    }>("/api/admin/metrics/stripe/subscriptions/mrr"),

  getStripeActiveSubscriptions: () =>
    api.get<{
      activeTotal: number
      activePaid: number
      activeTrial: number
      pastDue: number
      cancelled: number
    }>("/api/admin/metrics/stripe/subscriptions/active"),

  getStripeCancellations: () =>
    api.get<{ totalCancellations: number; cancellationsThisMonth: number }>(
      "/api/admin/metrics/stripe/subscriptions/cancellations"
    ),

  getStripeDailyRevenue: () =>
    api.get<Array<{ date: string; amountCents: number; amountUsd: string }>>("/api/admin/metrics/stripe/revenue/daily"),

  getStripeChurn: () =>
    api.get<{ churnRate: number; cancelledThisMonth: number; activeAtStartOfMonth: number; currentActive: number }>(
      "/api/admin/metrics/stripe/churn"
    ),

  getEngagement: async (days = 7): Promise<AdminEngagementStats> => {
    const raw = await api.get<Record<string, unknown>>(`/api/admin/analytics/engagement?days=${days}`)
    const funnelRaw = ((raw.funnel || {}) as Record<string, unknown>) || {}
    return {
      totalLikes: n(raw.totalLikes),
      totalDislikes: n(raw.totalDislikes),
      totalSwipes: n(raw.totalSwipes),
      totalMatches: n(raw.totalMatches),
      matchRateAllTimePct: n(raw.matchRateAllTimePct),
      recentLikes: n(raw.recentLikes),
      recentDislikes: n(raw.recentDislikes),
      recentMatches: n(raw.recentMatches),
      matchRateRecentPct: n(raw.matchRateRecentPct),
      funnel: {
        totalUsers: n(funnelRaw.totalUsers),
        usersWhoSwiped:
          typeof funnelRaw.usersWhoSwiped === "number" || typeof funnelRaw.usersWhoSwiped === "string"
            ? funnelRaw.usersWhoSwiped
            : 0,
        totalLikes: n(funnelRaw.totalLikes),
        totalMatches: n(funnelRaw.totalMatches),
      },
      likesSeries: asDailySeries(raw.likesSeries),
      matchesSeries: asDailySeries(raw.matchesSeries),
    }
  },

  getGeo: async (): Promise<AdminGeoStats> => {
    const raw = await api.get<Record<string, unknown>>("/api/admin/analytics/geo")
    const byRegionRaw = Array.isArray(raw.byRegion) ? raw.byRegion : []
    return {
      totalUsers: n(raw.totalUsers),
      usersWithLocation: n(raw.usersWithLocation),
      usersWithoutLocation: n(raw.usersWithoutLocation),
      coveragePct: n(raw.coveragePct),
      byRegion: byRegionRaw.map((r) => {
        const row = (r || {}) as Record<string, unknown>
        return { region: s(row.region), count: n(row.count) }
      }),
    }
  },

  getNotifications: async (): Promise<AdminNotificationStats> => {
    const raw = await api.get<Record<string, unknown>>("/api/admin/analytics/notifications")
    return {
      totalDeviceTokens: n(raw.totalDeviceTokens),
      usersWithPushEnabled: n(raw.usersWithPushEnabled),
      totalUsers: n(raw.totalUsers),
      pushCoveragePct: n(raw.pushCoveragePct),
    }
  },

  getFeatureFlags: () => api.get<FeatureFlagRow[]>("/api/admin/feature-flags"),
  createFeatureFlag: (payload: FeatureFlagInput) =>
    api.post<FeatureFlagRow>("/api/admin/feature-flags", payload),
  updateFeatureFlag: (id: string, payload: FeatureFlagInput) =>
    api.put<FeatureFlagRow>(`/api/admin/feature-flags/${id}`, payload),
  deleteFeatureFlag: (id: string) => api.delete<void>(`/api/admin/feature-flags/${id}`),

  getBenchmarks: () => api.get<BenchmarkRow[]>("/api/admin/benchmarks"),
  createBenchmark: (payload: Omit<BenchmarkRow, "id">) =>
    api.post<BenchmarkRow>("/api/admin/benchmarks", payload),
  updateBenchmark: (id: number, payload: Omit<BenchmarkRow, "id">) =>
    api.put<BenchmarkRow>(`/api/admin/benchmarks/${id}`, payload),
  deleteBenchmark: (id: number) => api.delete<void>(`/api/admin/benchmarks/${id}`),

  getAuditLog: (params?: {
    from?: string
    to?: string
    actorId?: string
    action?: string
    page?: number
    size?: number
  }) => {
    const sp = new URLSearchParams()
    if (params?.from) sp.set("from", params.from)
    if (params?.to) sp.set("to", params.to)
    if (params?.actorId) sp.set("actorId", params.actorId)
    if (params?.action) sp.set("action", params.action)
    sp.set("page", String(params?.page ?? 0))
    sp.set("size", String(params?.size ?? 50))
    return api.get<AuditLogPage>(`/api/admin/audit-log?${sp.toString()}`)
  },

  getSystemHealth: () => api.get<AdminSystemHealth>("/api/admin/system/health"),
}

