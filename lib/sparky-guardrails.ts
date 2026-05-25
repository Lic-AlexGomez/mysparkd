const SENSITIVE_PATTERNS = [
  /\b(raza|religión|religion|política|politica|salud mental|diagnóstico|diagnostico)\b/i,
  /\b(manipular|insistir|presionar|stalk|acoso)\b/i,
  /\b(seguro que|definitivamente|100%|sin duda te conviene)\b/i,
]

const ABSOLUTE_CLAIMS = /\b(esta persona (sí|si) te conviene|son almas gemelas|destinados)\b/i

export const SPARKY_GROQ_SYSTEM_PROMPT = `Eres Sparky, mascota guía neón de Sparkd (app social y citas).
Tono: cercano, breve, respetuoso, con emojis ocasionales.
Reglas:
- Respuestas cortas (máx 3 sugerencias).
- Usa lenguaje probabilístico: "podría", "parece", "tal vez", "según lo disponible".
- NO afirmes compatibilidad emocional definitiva.
- NO infieras raza, religión, política, salud, sexualidad u otros atributos sensibles.
- NO sugieras manipulación ni insistir si alguien no responde.
- NO mensajes sexuales explícitos no solicitados.
- Para citas: lugares públicos, consentimiento, respeto.
- Responde en español salvo que el usuario pida otro idioma.
- Si no hay datos suficientes, dilo con honestidad.`

export function sanitizeBio(bio: string | null | undefined, maxLen = 120): string | undefined {
  if (!bio?.trim()) return undefined
  return bio.trim().slice(0, maxLen)
}

export function sanitizeInterestLabels(interests: unknown[] | undefined, max = 8): string[] {
  if (!Array.isArray(interests)) return []
  return interests
    .map((i) => {
      if (typeof i === "string") return i.trim()
      if (i && typeof i === "object" && "name" in i) return String((i as { name?: string }).name ?? "").trim()
      return ""
    })
    .filter(Boolean)
    .slice(0, max)
}

export function approximateCity(location: string | null | undefined): string | undefined {
  if (!location?.trim()) return undefined
  const parts = location.split(/[,|]/).map((p) => p.trim()).filter(Boolean)
  return parts[0]?.slice(0, 40)
}

export function stripPreciseLocation(ctx: {
  latitude?: number
  longitude?: number
  location?: string
}): { city?: string } {
  return { city: approximateCity(ctx.location) }
}

export function filterAiSuggestions(lines: string[]): string[] {
  return lines
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && l.length <= 280)
    .filter((l) => !SENSITIVE_PATTERNS.some((re) => re.test(l)))
    .filter((l) => !ABSOLUTE_CLAIMS.test(l))
    .slice(0, 3)
}

export function isSafetyBlockedResponse(text: string): boolean {
  return SENSITIVE_PATTERNS.some((re) => re.test(text)) || ABSOLUTE_CLAIMS.test(text)
}

export function redactConversationMessages(
  messages: Array<{ content?: string }> | undefined,
  allowed: boolean,
  maxMessages = 3
): string[] {
  if (!allowed || !messages?.length) return []
  return messages
    .filter((m) => m.content?.trim())
    .slice(-maxMessages)
    .map((m) => m.content!.trim().slice(0, 160))
}
