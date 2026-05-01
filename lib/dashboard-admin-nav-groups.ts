/** Subgrupos del sidebar admin (orden visual). */
export const DASHBOARD_ADMIN_NAV_GROUPS: { label: string; ids: string[] }[] = [
  { label: "Visión general", ids: ["overview"] },
  { label: "Personas y contenido", ids: ["users", "content", "moderation"] },
  { label: "Métricas", ids: ["revenue", "engagement", "geo", "notifications"] },
  { label: "Plataforma", ids: ["abtesting", "benchmarks", "auditlog", "system"] },
]
