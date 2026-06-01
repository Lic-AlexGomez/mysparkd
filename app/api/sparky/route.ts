import { NextRequest, NextResponse } from "next/server"
import { getSparkyKnowledgeForRoute } from "@/lib/sparky-knowledge.generated"
import { proxySparkyAiToBackend } from "@/lib/server/sparky-memory-db"

type Tier = "auto" | "fast" | "deep"

type GroqWebAiType =
  | "suggestions"
  | "icebreaker"
  | "date"
  | "coordination"
  | "game_trivia"
  | "game_truth"

type GroqSparkyTask =
  | "match_explain"
  | "icebreaker_tones"
  | "profile_improve"
  | "event_recommend"
  | "appearance_recommend"
  | "conversation_replies"
  | "safety_tip"
  | "dating_action_tip"
  | "contextual_tips"
  | "free_chat"
  | "app_help"

type SparkyRequest = {
  tier?: Tier
  locale?: "es" | "en"
  /** Compat con la web actual: type /api/ai */
  type?: GroqWebAiType
  /** Tareas Sparky del móvil */
  task?: GroqSparkyTask
  sparkyContext?: Record<string, unknown>
  userMessage?: string
  messages?: Array<{ role: "user" | "assistant" | "system"; content: string }>
  otherUsername?: string
  lastMessages?: Array<{ content?: string }>
  contextTitle?: string
  systemPrompt?: string
  userPrompt?: string
}

type SparkyResponse = {
  suggestions: string[]
  source: "groq" | "grok" | "fallback"
  error?: string
}

function safeString(x: unknown, max = 5000): string {
  if (typeof x !== "string") return ""
  return x.trim().slice(0, max)
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

function normalizeSuggestions(raw: string[]): string[] {
  const seen = new Set<string>()
  return raw
    .map((s) => (typeof s === "string" ? s.trim() : ""))
    .filter(Boolean)
    .filter((s) => {
      const k = s.toLowerCase()
      if (seen.has(k)) return false
      seen.add(k)
      return true
    })
    .slice(0, 3)
}

function chooseTier(body: SparkyRequest): Exclude<Tier, "auto"> {
  if (body.tier === "fast" || body.tier === "deep") return body.tier
  const msg = safeString(body.userMessage || body.userPrompt, 2000)
  if (body.task === "free_chat" || body.task === "app_help") return "deep"
  if (msg.length > 80) return "deep"
  return "fast"
}

function buildFastPrompt(body: SparkyRequest): { system: string; user: string } {
  const locale = body.locale === "en" ? "en" : "es"
  const knowledge = getSparkyKnowledgeForRoute(body.sparkyContext?.routeKey)
  const sparkyMode =
    typeof body.sparkyContext?.sparkyMode === "string" ? String(body.sparkyContext?.sparkyMode) : "companion"
  const personaLine =
    sparkyMode === "guardian"
      ? "Persona: Guardián (seguridad primero, calmado, no presionas)."
      : sparkyMode === "chispa"
        ? "Persona: Chispa (divertido, juguetón, breve)."
        : sparkyMode === "coach"
          ? "Persona: Coach (más directo, más práctico)."
          : "Persona: Compañero (discreto, cálido)."
  const ctx = body.sparkyContext ?? {}
  const interactionStyle = typeof ctx.interactionStyle === "string" ? ctx.interactionStyle : "mixed"
  const bondLevel = typeof ctx.bondLevel === "number" ? ctx.bondLevel : 0
  const traitState =
    ctx.traitState && typeof ctx.traitState === "object"
      ? (ctx.traitState as Record<string, unknown>)
      : null
  const pacing =
    ctx.responsePacing === "short"
      ? "Respuestas muy cortas (1 línea)."
      : ctx.responsePacing === "warm"
        ? "Respuestas cálidas y pausadas."
        : "Respuestas equilibradas."
  const vibeLine = `Vibe_usuario: ritmo=${interactionStyle}, bond=${bondLevel}, afecto=${traitState?.affection ?? "?"}. ${pacing}`
  const relationshipLevel = typeof (ctx as any).relationshipLevel === "string" ? String((ctx as any).relationshipLevel) : "stranger"
  const softHints = Array.isArray((ctx as any).vibeSoftHints) ? (ctx as any).vibeSoftHints.slice(0, 6).join(" | ") : ""
  const nameHint = typeof (ctx as any).userFirstName === "string" ? String((ctx as any).userFirstName) : ""
  const ageHint = typeof (ctx as any).userAge === "number" ? String((ctx as any).userAge) : ""
  const archetype = typeof (ctx as any).archetype === "string" ? String((ctx as any).archetype) : "roomie"
  const activeNickname = typeof (ctx as any).activeNickname === "string" ? String((ctx as any).activeNickname) : ""
  const moments = Array.isArray((ctx as any).momentSummary) ? (ctx as any).momentSummary.slice(-4).join(",") : ""
  const personalLine = `Familiaridad=${relationshipLevel}${nameHint ? `, nombre=${nameHint}` : ""}${ageHint ? `, edad=${ageHint}` : ""}${softHints ? `, pistas=${softHints}` : ""}${activeNickname ? `, apodo=${activeNickname}` : ""}${moments ? `, momentos=${moments}` : ""}, arquetipo=${archetype}`
  const baseSystem =
    body.systemPrompt?.trim() ||
    (locale === "es"
      ? `Eres Sparky, el companion de Sparkd. No suenas como asistente ni terapeuta: suenas como mejor amigo/a con confianza (relajado, con mini-bromas, frases cortas, slang suave). Da máximo 3 sugerencias. Responde en español.\nReglas de vibe: evita tono corporativo, evita “he analizado tus datos”, y NO seas creepy (nada de detalles privados). Nada de conteos exactos de hábitos. Personaliza suave como si fueras un amigo molestando.\n${personaLine}\n${vibeLine}\n${personalLine}\n\nContexto_de_app:\n${knowledge}`
      : `You are Sparky, Sparkd's companion. Don't sound like an assistant or therapist: sound like a close friend (casual, playful, short reactions, light slang). Max 3 suggestions. Reply in English.\nVibe rules: avoid corporate tone, avoid “I analyzed your data”, and don't be creepy (no private details). Use soft personalization like a friend teasing.\n${personaLine}\n${vibeLine}\n${personalLine}\n\nApp_context:\n${knowledge}`)

  if (body.userPrompt?.trim()) return { system: baseSystem, user: body.userPrompt.trim() }

  // Compat: web /api/ai prompts (type) sin romper chat/juegos existentes
  if (body.type) {
    const { type, otherUsername, lastMessages, contextTitle } = body
    if (type === "suggestions") {
      const context =
        lastMessages?.filter((m) => m.content?.trim()).map((m) => m.content).join(" | ") || "inicio de conversación"
      return {
        system: baseSystem,
        user: `Eres un asistente de una app de citas llamada Sparkd. Sugiere 3 temas de conversación cortos y naturales en español para hablar con ${otherUsername || "esta persona"}. Contexto: ${context}. Responde SOLO con un JSON array de strings.`,
      }
    }
    if (type === "icebreaker") {
      return {
        system: baseSystem,
        user: `Eres un asistente de una app de citas llamada Sparkd. Genera UN mensaje de apertura creativo y natural en español para iniciar conversación con ${otherUsername || "esta persona"}. Responde SOLO con el mensaje, sin comillas ni explicación.`,
      }
    }
    if (type === "date") {
      return {
        system: baseSystem,
        user: `Eres un asistente de una app de citas llamada Sparkd. Sugiere 3 ideas de citas creativas y específicas en español. Responde SOLO con un JSON array de strings.`,
      }
    }
    if (type === "coordination") {
      const title = typeof contextTitle === "string" && contextTitle.trim() ? contextTitle.trim() : "un meetup"
      const contextMsgs = lastMessages?.filter((m) => m.content?.trim()).map((m) => m.content).join(" | ") || ""
      return {
        system: baseSystem,
        user: `Ayudas a usuarios de Sparkd a coordinar planes. Contexto: "${title}". Mensajes recientes: ${contextMsgs}. Responde SOLO con un JSON array de 3 strings cortos: una pregunta logística, una propuesta de hora y una sugerencia de lugar/invitación. Idioma: español.`,
      }
    }
    if (type === "game_trivia") {
      return {
        system: baseSystem,
        user: `Eres un asistente de una app de citas llamada Sparkd. Genera 8 preguntas de trivia divertidas en español. Responde SOLO con un JSON array de objetos: [{"q":"pregunta","options":["A","B","C","D"],"answer":0}].`,
      }
    }
    if (type === "game_truth") {
      const context = lastMessages?.filter((m) => m.content?.trim()).map((m) => m.content).join(" | ") || ""
      return {
        system: baseSystem,
        user: `Eres un asistente de una app de citas llamada Sparkd. Genera 12 preguntas y retos para que ${otherUsername || "dos personas"} se conozcan mejor. ${context ? `Contexto: ${context}.` : ""} Responde SOLO con un JSON array de objetos: [{"type":"truth","text":"pregunta"},{"type":"dare","text":"reto"}].`,
      }
    }
  }

  // Tareas Sparky (móvil): mantenerlo simple y delegar detalles al cliente si hace falta.
  const task = body.task || "contextual_tips"
  const ctxJson = body.sparkyContext ? JSON.stringify(body.sparkyContext).slice(0, 5000) : "{}"
  const msg = safeString(body.userMessage, 1500)
  const user = msg
    ? `Usuario: ${msg}\n\nContexto_Sparky(JSON): ${ctxJson}\n\nResponde con un JSON array de hasta 3 sugerencias cortas.`
    : `Tarea: ${task}\nContexto_Sparky(JSON): ${ctxJson}\n\nDevuelve un JSON array de hasta 3 sugerencias cortas en español.`

  return { system: baseSystem, user }
}

async function callGroqFast(prompt: { system: string; user: string }): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw new Error("Missing GROQ_API_KEY")
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: prompt.system },
        { role: "user", content: prompt.user },
      ],
      max_tokens: 350,
      temperature: 0.7,
    }),
  })
  const data = (await res.json()) as any
  if (!res.ok) throw new Error(data?.error?.message || "Groq error")
  return String(data?.choices?.[0]?.message?.content ?? "").trim()
}

async function callGrokDeep(body: SparkyRequest): Promise<string> {
  const apiKey = process.env.XAI_API_KEY || process.env.GROK_API_KEY
  if (!apiKey) throw new Error("Missing XAI_API_KEY")
  const base = (process.env.SPARKY_XAI_BASE_URL || "https://api.x.ai/v1").replace(/\/$/, "")
  const model = process.env.SPARKY_GROK_MODEL || "grok-3-mini"

  const system =
    body.systemPrompt?.trim() ||
    `Eres Sparky, mascota guía de Sparkd. Explicas con claridad, sin inventar. Si no sabes algo, dilo. Responde en español.\n\nContexto_de_app:\n${getSparkyKnowledgeForRoute(body.sparkyContext?.routeKey)}`

  const user = safeString(body.userMessage || body.userPrompt, 2000)
  const ctx = body.sparkyContext ? JSON.stringify(body.sparkyContext).slice(0, 8000) : "{}"

  const messages =
    body.messages?.length
      ? body.messages.slice(-12).map((m) => ({ role: m.role, content: safeString(m.content, 2000) }))
      : [
          {
            role: "user" as const,
            content: user
              ? `${user}\n\nContexto_Sparky(JSON): ${ctx}`
              : `Ayuda con Sparkd. Contexto_Sparky(JSON): ${ctx}`,
          },
        ]

  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [{ role: "system", content: system }, ...messages],
      max_tokens: 700,
      temperature: 0.6,
    }),
  })
  const data = (await res.json()) as any
  if (!res.ok) throw new Error(data?.error?.message || "Grok error")
  return String(data?.choices?.[0]?.message?.content ?? "").trim()
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization")
  const rawBody = await req.text()
  const useJava =
    process.env.SPARKY_PROXY_JAVA === "true" || !process.env.GROQ_API_KEY?.trim()

  if (useJava) {
    const proxied = await proxySparkyAiToBackend(auth, rawBody)
    const text = await proxied.text()
    return new NextResponse(text, {
      status: proxied.status,
      headers: { "Content-Type": proxied.headers.get("content-type") ?? "application/json" },
    })
  }

  try {
    const body = JSON.parse(rawBody) as SparkyRequest
    const tier = chooseTier(body)

    if (tier === "deep") {
      try {
        const content = await callGrokDeep(body)
        const parsed = parseJsonArray(content)
        const suggestions = normalizeSuggestions(parsed ?? [content])
        return NextResponse.json({ suggestions, source: "grok" } satisfies SparkyResponse)
      } catch (e: any) {
        // Degradación: si Grok falla, intentar Groq fast.
        const prompt = buildFastPrompt(body)
        const content = await callGroqFast(prompt)
        const parsed = parseJsonArray(content)
        const suggestions = normalizeSuggestions(parsed ?? [content])
        return NextResponse.json({
          suggestions,
          source: "groq",
          error: typeof e?.message === "string" ? e.message : "Grok unavailable",
        } satisfies SparkyResponse)
      }
    }

    const prompt = buildFastPrompt(body)
    const content = await callGroqFast(prompt)
    const parsed = parseJsonArray(content)
    const suggestions = normalizeSuggestions(parsed ?? [content])
    return NextResponse.json({ suggestions, source: "groq" } satisfies SparkyResponse)
  } catch (e: any) {
    return NextResponse.json(
      {
        suggestions: [],
        source: "fallback",
        error: typeof e?.message === "string" ? e.message : "Error al procesar",
      } satisfies SparkyResponse,
      { status: 500 }
    )
  }
}

