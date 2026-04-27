import { ApiError } from "./api"

/** Backend puede devolver un array o un objeto paginado tipo Spring `Page`. */
export function extractArray<T>(raw: unknown, arrayKeys: string[] = ["content", "data", "items", "users", "rows"]): T[] {
  if (raw == null) return []
  if (Array.isArray(raw)) return raw as T[]
  if (typeof raw === "object") {
    const o = raw as Record<string, unknown>
    for (const key of arrayKeys) {
      const v = o[key]
      if (Array.isArray(v)) return v as T[]
    }
  }
  return []
}

export function apiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError && error.message.trim()) return error.message
  if (error instanceof Error && error.message.trim()) return error.message
  return fallback
}

export function apiErrorStatus(error: unknown): number | undefined {
  if (error instanceof ApiError) return error.status
  return undefined
}

/**
 * Listado de usuarios (Spring suele ser Page: `content[]`).
 * No usar `/admin/users` sin `/api`: en muchos despliegues responde 404 «No static resource…».
 */
export const ADMIN_USERS_LIST_GET = "/api/admin/users?page=0&size=200" as const

export function formatAdminUsersLoadError(error: unknown): string {
  const st = apiErrorStatus(error)
  const base = apiErrorMessage(error, "No se pudo cargar la lista de usuarios.")
  if (st === 404) {
    return (
      "No existe aún (o no está mapeada) la ruta GET /api/admin/users en el backend desplegado (404). " +
      "Las estadísticas usan otras rutas (p. ej. /admin/stats); el listado completo es independiente. " +
      "Hace falta publicar ese controlador o alinear el proxy a la ruta real."
    )
  }
  if (st === 500) {
    const b = base.toLowerCase()
    if (b.includes("lower(bytea)") || b.includes("function lower")) {
      return (
        "Error en el backend al listar usuarios: PostgreSQL recibe `lower()` sobre un valor tratado como binario (bytea), " +
        "suele ser columna de texto mapeada mal, tipo incorrecto en BD, o criterios de búsqueda. " +
        "Hay que corregir entidad/repositorio o `CAST(... AS text)` en la consulta; el front no puede resolverlo. " +
        "Detalle: lower(bytea) / JDBC."
      )
    }
    if (b.includes("jdbc exception") && base.length > 200) {
      return (
        "Error interno (HTTP 500) al ejecutar la consulta de usuarios en el servidor. " +
        "Revisa logs del API y el SQL del listado admin; el mensaje largo de JDBC suele ser diagnóstico en backend."
      )
    }
  }
  return base
}
