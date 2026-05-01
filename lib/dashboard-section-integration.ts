/**
 * Estado de integración con el backend (solo documentación usada en UI).
 * “live” = API con persistencia/alcance esperado en producción.
 * “partial” = API real, pero con limitación conocida en backend (p. ej. datos en memoria o no persistentes).
 * “demo” = maquetado sin API.
 */
export type DashboardIntegrationSource = "live" | "partial" | "demo"

export type DashboardSectionIntegration = {
  source: DashboardIntegrationSource
  /** Texto corto para badge */
  shortLabel: string
  /** Explicación para el usuario técnico */
  detail: string
}

export const DASHBOARD_SECTION_INTEGRATION: Record<string, DashboardSectionIntegration> = {
  // Admin
  overview: {
    source: "live",
    shortLabel: "API",
    detail:
      "KPIs y crecimiento vía GET /api/admin/stats y /api/admin/growth; series de matches e ingresos vía GET /api/admin/analytics/matches-daily y /revenue-daily.",
  },
  users: {
    source: "live",
    shortLabel: "API",
    detail:
      "Listado GET /api/admin/users. Acciones: POST …/users/{id}/enable|disable, roles vía POST /api/administrator/user-roles/assign.",
  },
  content: {
    source: "live",
    shortLabel: "API",
    detail: "GET /api/admin/analytics/content-stats — contadores y serie temporal de posts.",
  },
  revenue: {
    source: "live",
    shortLabel: "API",
    detail:
      "Stripe metrics: GET /api/admin/metrics/stripe/subscriptions/*, /revenue/daily, /churn (requiere datos Stripe en el backend).",
  },
  engagement: {
    source: "live",
    shortLabel: "API",
    detail: "GET /api/admin/analytics/engagement?days= — KPIs, embudo y series likes/matches.",
  },
  moderation: {
    source: "live",
    shortLabel: "API",
    detail: "Misma API de reportes que Manager: listado, resolver y descartar (reportService).",
  },
  geo: {
    source: "live",
    shortLabel: "API",
    detail: "GET /api/admin/analytics/geo — cobertura y distribución por región (sin PII).",
  },
  notifications: {
    source: "live",
    shortLabel: "API",
    detail: "GET /api/admin/analytics/notifications — tokens FCM y cobertura de push.",
  },
  abtesting: {
    source: "live",
    shortLabel: "API",
    detail: "CRUD feature flags: GET/POST/PUT/DELETE /api/admin/feature-flags.",
  },
  benchmarks: {
    source: "live",
    shortLabel: "API",
    detail:
      "CRUD GET/POST/PUT/DELETE /api/admin/benchmarks. Nota operativa: el backend actual guarda estos datos en memoria (se pierden al reiniciar el servidor).",
  },
  auditlog: {
    source: "live",
    shortLabel: "API",
    detail: "GET /api/admin/audit-log con filtros (from/to/actorId/action) y paginación.",
  },
  system: {
    source: "live",
    shortLabel: "API",
    detail: "GET /api/admin/system/health — DB, Redis, heap JVM y uptime; polling cada 30s.",
  },
  // Manager
  "m-activity": {
    source: "live",
    shortLabel: "API",
    detail: "GET /api/manager/activity — feed paginado de reportes/actividad.",
  },
  "m-users": {
    source: "live",
    shortLabel: "API",
    detail: "GET /api/manager/users — listado paginado para rol MANAGER.",
  },
  "m-content": {
    source: "live",
    shortLabel: "API",
    detail: "GET /api/manager/posts y acciones hide/restore/delete.",
  },
  "m-reports": {
    source: "live",
    shortLabel: "API",
    detail: "Misma API que Admin moderación: reportes pendientes, resolver y descartar.",
  },
  "m-messages": {
    source: "demo",
    shortLabel: "Demo",
    detail: "Chats de ejemplo. Falta API de inspección de conversaciones (si aplica).",
  },
}

export function getSectionIntegration(
  id: string
): DashboardSectionIntegration | undefined {
  return DASHBOARD_SECTION_INTEGRATION[id]
}
