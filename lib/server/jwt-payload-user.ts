/**
 * Best-effort JWT payload read (no signature verify) — BFF dev / same as many gateways.
 * Production JVM should validate tokens; this matches `sub` / common id claims to gate routes.
 */
export function decodeJwtUserId(authorizationHeader: string | null): string | null {
  if (!authorizationHeader?.toLowerCase().startsWith("bearer ")) return null
  const token = authorizationHeader.slice(7).trim()
  if (!token) return null
  const parts = token.split(".")
  if (parts.length < 2) return null
  try {
    const segment = parts[1].replace(/-/g, "+").replace(/_/g, "/")
    const pad = segment.length % 4 === 0 ? "" : "=".repeat(4 - (segment.length % 4))
    const json = Buffer.from(segment + pad, "base64").toString("utf8")
    const o = JSON.parse(json) as Record<string, unknown>
    const raw = o.sub ?? o.userId ?? o.user_id ?? o.id ?? o.user_id_string
    if (raw == null || raw === "") return null
    return String(raw)
  } catch {
    return null
  }
}
