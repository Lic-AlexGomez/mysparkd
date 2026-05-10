import type { Interest, User } from '../types'

export function normalizeInterestLabel(interest: unknown): string {
  if (typeof interest === "string") return interest.trim()
  if (interest && typeof interest === "object") {
    const i = interest as { name?: string; interestId?: string }
    return String(i.name || i.interestId || "").trim()
  }
  return ""
}

/** Lista de intereses de perfil en JSON de tarjeta/API (no confundir con intereses recibidos en la cita). */
export function coerceProfileInterestsArray(raw: unknown): Array<string | Interest> | undefined {
  if (!Array.isArray(raw) || raw.length === 0) return undefined
  const first = raw[0]
  if (typeof first === "string") return raw as string[]
  if (first && typeof first === "object") {
    const f = first as Record<string, unknown>
    if (
      typeof f.status === "string" &&
      ["PENDING", "ACCEPTED", "REJECTED"].includes(f.status)
    ) {
      return undefined
    }
    if ("name" in f || "interestId" in f) return raw as Interest[]
  }
  return undefined
}

/** Busca intereses del autor en el DTO plano o anidado (`user`, `author`, etc.). */
export function extractAuthorInterestsFromDateCardRaw(
  raw: Record<string, unknown>
): Array<string | Interest> | undefined {
  const keys = ["authorInterests", "author_interests", "hostInterests", "host_interests"]
  for (const k of keys) {
    const coerced = coerceProfileInterestsArray(raw[k])
    if (coerced) return coerced
  }
  for (const nestKey of [
    "author",
    "authorUser",
    "author_user",
    "user",
    "profile",
    "host",
    "hostProfile",
  ]) {
    const node = raw[nestKey]
    if (!node || typeof node !== "object") continue
    const coerced = coerceProfileInterestsArray((node as Record<string, unknown>).interests)
    if (coerced) return coerced
  }
  return undefined
}

/**
 * Compatibilidad 0–100 solo por solape de intereses de perfil (Jaccard sobre etiquetas únicas).
 * `null` si falta algún perfil sin intereses o no se puede calcular.
 */
export function compatibilityPercentFromInterestsOnly(
  viewerInterests: Array<string | Interest> | null | undefined,
  hostInterests: Array<string | Interest> | null | undefined
): number | null {
  const labelsA = [
    ...new Set(
      (viewerInterests ?? [])
        .map(normalizeInterestLabel)
        .filter(Boolean)
        .map((s) => s.toLowerCase())
    ),
  ]
  const labelsB = [
    ...new Set(
      (hostInterests ?? [])
        .map(normalizeInterestLabel)
        .filter(Boolean)
        .map((s) => s.toLowerCase())
    ),
  ]
  if (labelsA.length === 0 || labelsB.length === 0) return null
  const setB = new Set(labelsB)
  let shared = 0
  for (const x of labelsA) {
    if (setB.has(x)) shared++
  }
  const union = new Set([...labelsA, ...labelsB]).size
  if (union === 0) return null
  return Math.round(Math.min(100, Math.max(0, (shared / union) * 100)))
}

export const compatibilityService = {
  calculateCompatibility(user1: Partial<User>, user2: Partial<User>): number {
    let score = 0
    
    // Intereses compartidos (40%)
    const interests1 = user1.interests || []
    const interests2 = user2.interests || []
    const interests1Names = interests1.map(normalizeInterestLabel).filter(Boolean)
    const interests2Names = interests2.map(normalizeInterestLabel).filter(Boolean)
    const set2Lc = new Set(interests2Names.map((s) => s.toLowerCase()))
    const sharedInterests = interests1Names.filter((i) =>
      set2Lc.has(i.toLowerCase())
    ).length
    const totalInterests = Math.max(interests1Names.length, interests2Names.length)
    const interestScore = totalInterests > 0 ? (sharedInterests / totalInterests) * 40 : 0
    score += interestScore
    
    // Reputación compatible (35%)
    const rep1 = user1.reputation || 50
    const rep2 = user2.reputation || 50
    const repDiff = Math.abs(rep1 - rep2)
    const repScore = (1 - repDiff / 100) * 35
    score += repScore
    
    // Nivel de verificación (25%)
    const ver1 = user1.verificationLevel || 0
    const ver2 = user2.verificationLevel || 0
    const verScore = Math.min(ver1, ver2) * 6.25
    score += verScore
    
    return Math.round(Math.max(0, Math.min(100, score)))
  },

  getCompatibilityLevel(score: number): string {
    if (score >= 80) return 'Muy Alta'
    if (score >= 60) return 'Alta'
    if (score >= 40) return 'Media'
    return 'Baja'
  }
}
