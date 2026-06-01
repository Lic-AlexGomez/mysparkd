"use client"

import { api } from "@/lib/api"

export type SparkyAiResponse = {
  suggestions?: string[]
  reply?: string
  source?: string
  error?: string
}

const SPARKY_AI_PATHS = ["/api/sparky", "/api/ai"]

function extractSuggestions(data: SparkyAiResponse): string[] | null {
  if (Array.isArray(data.suggestions) && data.suggestions.length) {
    return data.suggestions.filter((s): s is string => typeof s === "string" && s.trim().length > 0)
  }
  if (typeof data.reply === "string" && data.reply.trim()) {
    return [data.reply.trim()]
  }
  return null
}

export async function postSparkyAi(body: Record<string, unknown>): Promise<SparkyAiResponse> {
  for (const path of SPARKY_AI_PATHS) {
    try {
      const data = await api.post<SparkyAiResponse>(path, body)
      const suggestions = extractSuggestions(data)
      if (suggestions?.length) {
        return { ...data, suggestions, source: data.source ?? "proxy" }
      }
      if (data.error) return data
    } catch {
      /* try next */
    }
  }
  return { suggestions: [], source: "fallback", error: "IA no disponible" }
}
