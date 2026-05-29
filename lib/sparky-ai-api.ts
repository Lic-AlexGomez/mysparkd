"use client"

export type SparkyAiResponse = {
  suggestions?: string[]
  source?: string
  error?: string
}

const SPARKY_AI_URLS = ["/api/sparky", "/api/ai"]

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  }
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("sparkd_token")
    if (token) headers.Authorization = `Bearer ${token}`
  }
  return headers
}

export async function postSparkyAi(body: Record<string, unknown>): Promise<SparkyAiResponse> {
  const headers = authHeaders()
  for (const url of SPARKY_AI_URLS) {
    try {
      const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) })
      const data = (await res.json()) as SparkyAiResponse
      if (res.ok && Array.isArray(data.suggestions) && data.suggestions.length) return data
      if (res.ok && data.error) return data
    } catch {
      /* try next */
    }
  }
  return { suggestions: [], source: "fallback", error: "IA no disponible" }
}
