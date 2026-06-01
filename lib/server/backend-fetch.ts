export async function backendJson(
  backendBaseUrl: string,
  pathWithQuery: string,
  authHeader: string | null
): Promise<{ ok: boolean; data: unknown }> {
  const base = backendBaseUrl.replace(/\/$/, "")
  const path = pathWithQuery.startsWith("/") ? pathWithQuery : `/${pathWithQuery}`
  const url = `${base}${path}`
  const headers: Record<string, string> = { Accept: "application/json" }
  if (authHeader) headers.Authorization = authHeader
  try {
    const res = await fetch(url, {
      method: "GET",
      headers,
      signal: AbortSignal.timeout(12_000),
    })
    if (!res.ok) return { ok: false, data: null }
    const data = await res.json().catch(() => null)
    return { ok: true, data }
  } catch {
    return { ok: false, data: null }
  }
}
