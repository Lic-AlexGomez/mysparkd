/**
 * Normaliza respuestas del backend: array directo o página Spring `{ content: [...] }`.
 * Evita crashes del tipo "e.map is not a function" en producción.
 */

/** Detecta `Page` de Spring Data (`content` + metadatos de paginación). */
export function isSpringPagePayload(data: unknown): boolean {
  if (!data || typeof data !== "object" || Array.isArray(data)) return false
  const obj = data as Record<string, unknown>
  if (!Array.isArray(obj.content)) return false
  return (
    typeof obj.totalElements === "number" ||
    typeof obj.totalPages === "number" ||
    typeof obj.number === "number" ||
    "pageable" in obj ||
    ("first" in obj && "last" in obj)
  )
}

/** Devuelve `content` si es página Spring; si no, el payload tal cual. */
export function unwrapSpringPage<T>(data: unknown): T {
  if (isSpringPagePayload(data)) {
    return (data as Record<string, unknown>).content as T
  }
  return data as T
}

export function extractApiRows<T = Record<string, unknown>>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>
    if (Array.isArray(obj.content)) return obj.content as T[]
    if (Array.isArray(obj.data)) return obj.data as T[]
    if (Array.isArray(obj.items)) return obj.items as T[]
    if (Array.isArray(obj.posts)) return obj.posts as T[]
    if (Array.isArray(obj.chats)) return obj.chats as T[]
    if (Array.isArray(obj.messages)) return obj.messages as T[]
    if (Array.isArray(obj.notifications)) return obj.notifications as T[]
  }
  return []
}

export function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === "string")
  }
  return []
}
