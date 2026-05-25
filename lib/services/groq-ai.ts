import { filterAiSuggestions, SPARKY_GROQ_SYSTEM_PROMPT } from "@/lib/sparky-guardrails"

export type GroqWebAiType =
  | "suggestions"
  | "icebreaker"
  | "date"
  | "coordination"
  | "game_trivia"
  | "game_truth"

export type GroqSparkyTask =
  | "match_explain"
  | "icebreaker_tones"
  | "profile_improve"
  | "event_recommend"
  | "appearance_recommend"
  | "conversation_replies"
  | "safety_tip"
  | "dating_action_tip"
  | "contextual_tips"

export type GroqAiPayload = {
  type?: GroqWebAiType
  task?: GroqSparkyTask
  otherUsername?: string
  lastMessages?: Array<{ content?: string }>
  contextTitle?: string
  sparkyContext?: Record<string, unknown>
}

export type GroqAiResult = {
  suggestions: string[]
  source: "groq" | "proxy" | "fallback"
  error?: string
}

function parseJsonArray(content: string): string[] | null {
  try {
    const jsonMatch = content.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as unknown
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => {
            if (typeof item === "string") return item
            if (item && typeof item === "object" && "text" in item) return String((item as { text: string }).text)
            return null
          })
          .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
      }
    }
  } catch {
    /* ignore */
  }
  if (content.trim()) return [content.replace(/^"|"$/g, "").trim()]
  return null
}

async function postAi(body: GroqAiPayload): Promise<GroqAiResult | null> {
  try {
    const res = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    if (!res.ok) return null
    const data = (await res.json()) as { result?: unknown; error?: string }
    const raw = data.result
    if (Array.isArray(raw)) {
      const suggestions = filterAiSuggestions(raw.filter((s): s is string => typeof s === "string"))
      if (suggestions.length) return { suggestions, source: "groq" }
    }
    if (typeof raw === "string" && raw.trim()) {
      return { suggestions: filterAiSuggestions([raw]), source: "groq" }
    }
    return null
  } catch {
    return null
  }
}

function buildSparkyUserPrompt(task: GroqSparkyTask, ctx: Record<string, unknown>): string {
  const base = JSON.stringify(ctx)
  switch (task) {
    case "match_explain":
      return `${SPARKY_GROQ_SYSTEM_PROMPT}\n\nExplica por qué PODRÍAN ser compatibles. Contexto: ${base}. SOLO JSON array de 2-3 strings breves en español.`
    case "icebreaker_tones":
      return `${SPARKY_GROQ_SYSTEM_PROMPT}\n\n3 frases para iniciar conversación. Contexto: ${base}. SOLO JSON array de 3 strings.`
    case "profile_improve":
      return `${SPARKY_GROQ_SYSTEM_PROMPT}\n\nMejoras al perfil. Contexto: ${base}. SOLO JSON array de 2-3 strings.`
    case "event_recommend":
      return `${SPARKY_GROQ_SYSTEM_PROMPT}\n\nRecomienda evento(s). Contexto: ${base}. SOLO JSON array de 1-2 strings.`
    case "appearance_recommend":
      return `${SPARKY_GROQ_SYSTEM_PROMPT}\n\nSugiere skin/paleta. Contexto: ${base}. SOLO JSON array de 2 strings.`
    case "conversation_replies":
      return `${SPARKY_GROQ_SYSTEM_PROMPT}\n\n3 respuestas cortas. Contexto: ${base}. SOLO JSON array de 3 strings.`
    case "dating_action_tip":
      return `${SPARKY_GROQ_SYSTEM_PROMPT}\n\nTip para Discover. Contexto: ${base}. SOLO JSON array de 2-3 strings.`
    default:
      return `${SPARKY_GROQ_SYSTEM_PROMPT}\n\nTips breves. Contexto: ${base}. SOLO JSON array de strings.`
  }
}

function mapTaskToWebType(task: GroqSparkyTask): GroqWebAiType | null {
  switch (task) {
    case "icebreaker_tones":
      return "icebreaker"
    case "conversation_replies":
      return "suggestions"
    case "event_recommend":
      return "date"
    default:
      return null
  }
}

export async function callGroqAi(payload: GroqAiPayload): Promise<GroqAiResult> {
  const webType = payload.type ?? (payload.task ? mapTaskToWebType(payload.task) : null)

  if (webType) {
    const result = await postAi({
      type: webType,
      otherUsername: payload.otherUsername,
      lastMessages: payload.lastMessages,
      contextTitle: payload.contextTitle,
    })
    if (result) return result
  }

  if (payload.task && payload.sparkyContext) {
    const prompt = buildSparkyUserPrompt(payload.task, payload.sparkyContext)
    const parsed = parseJsonArray(prompt)
    if (parsed?.length) return { suggestions: filterAiSuggestions(parsed), source: "fallback" }
  }

  return { suggestions: [], source: "fallback", error: "Sparky no pudo conectar con la IA ahora." }
}
