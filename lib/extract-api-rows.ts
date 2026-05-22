/**
 * Normaliza respuestas del backend: array directo o página Spring `{ content: [...] }`.
 * Evita crashes del tipo "e.map is not a function" en producción.
 */
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
