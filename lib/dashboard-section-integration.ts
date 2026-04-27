/**
 * Estado de integración con el backend (solo documentación usada en UI).
 * “live” = llama a API en este repo; “partial” = mezcla API + datos fijos; “demo” = maquetado sin API.
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
    source: "partial",
    shortLabel: "Parcial",
    detail:
      "KPIs y crecimiento 7d vía adminService: GET /admin/stats y /admin/growth. Gráficos «Matches (7d)» e «Ingresos diarios» aún con series demo.",
  },
  users: {
    source: "partial",
    shortLabel: "Parcial",
    detail:
      "Solo GET /api/admin/users (p. ej. ?page=0&size=200). No «/admin/users» a secas (suele 404 static resource en Spring). Acciones: POST …/users/{id}/enable|disable, roles vía /api/administrator/user-roles/assign.",
  },
  content: {
    source: "demo",
    shortLabel: "Demo",
    detail: "Números y listas fijas en el front; hace falta un endpoint (p. ej. /api/admin/content-stats).",
  },
  revenue: {
    source: "demo",
    shortLabel: "Demo",
    detail: "MRR, transacciones y cancelaciones de ejemplo. Falta conectar facturación/suscripciones reales.",
  },
  engagement: {
    source: "demo",
    shortLabel: "Demo",
    detail: "Swipes, matches, funnel: datos estáticos. Requiere endpoints de analítica.",
  },
  moderation: {
    source: "live",
    shortLabel: "API",
    detail: "Misma API de reportes que Manager: listado, resolver y descartar (reportService).",
  },
  geo: {
    source: "demo",
    shortLabel: "Demo",
    detail: "Geografía, idiomas e IDs: demostración. Requiere agregación geo en backend.",
  },
  notifications: {
    source: "demo",
    shortLabel: "Demo",
    detail: "Métricas y campañas de ejemplo. Sin envío a Firebase/analytics aún.",
  },
  abtesting: {
    source: "demo",
    shortLabel: "Demo",
    detail: "Pruebas A/B simuladas.",
  },
  benchmarks: {
    source: "demo",
    shortLabel: "Demo",
    detail: "Comparativas de referencia, no conectan a servicios externos.",
  },
  auditlog: {
    source: "demo",
    shortLabel: "Demo",
    detail: "Línea de auditoría con filas fijas. Falta GET /api/admin/audit-log o similar.",
  },
  system: {
    source: "demo",
    shortLabel: "Demo",
    detail: "Salud, logs y tráfico: datos de ejemplo. Requiere observabilidad real (metrics/logs).",
  },
  // Manager
  "m-activity": {
    source: "demo",
    shortLabel: "Demo",
    detail: "Actividad en vivo simulada (feed fijo).",
  },
  "m-users": {
    source: "demo",
    shortLabel: "Demo",
    detail: "Tabla de usuarios de ejemplo. Podría reutilizar /api/admin/users con permisos de manager.",
  },
  "m-content": {
    source: "demo",
    shortLabel: "Demo",
    detail: "Posts de demostración. Falta endpoint de moderación de contenido.",
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
