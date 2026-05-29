/** Extrae userId del JWT Bearer (sin verificar firma — el login ya validó en el backend). */
export function userIdFromAuthorization(authHeader: string | null): string | null {
  if (!authHeader?.startsWith("Bearer ")) return null
  const token = authHeader.slice(7).trim()
  const parts = token.split(".")
  if (parts.length < 2) return null
  try {
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/")
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4)
    const payload = JSON.parse(Buffer.from(padded, "base64").toString("utf8")) as Record<
      string,
      unknown
    >
    const id =
      payload.uuid ?? payload.sub ?? payload.userId ?? payload.id ?? payload.user_id
    if (id == null) return null
    return String(id).trim().slice(0, 64) || null
  } catch {
    return null
  }
}
