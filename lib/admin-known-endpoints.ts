/** Referencia: rutas que el front intenta (proxy → `NEXT_PUBLIC_API_URL`). */
export const ADMIN_PANEL_API_REFERENCE = [
  { area: "Overview", methods: "GET", paths: ["/admin/stats", "/admin/growth"] },
  { area: "Usuarios", methods: "GET", paths: ["/api/admin/users?page&size (paginado Spring)"] },
  { area: "Usuarios · acción", methods: "POST", paths: ["/api/admin/users/{id}/enable", "/api/admin/users/{id}/disable"] },
  { area: "Roles", methods: "POST", paths: ["/api/administrator/user-roles/assign"] },
  { area: "Moderación / reportes", methods: "GET, POST", paths: ["/moderator/reports", "/api/admin/reports", "…/resolve", "…/dismiss"] },
] as const
