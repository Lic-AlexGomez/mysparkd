/**
 * Enum `sparkd.Enums.AccountType` en el backend: DATING, SOCIAL, BOTH.
 * No mezclar con el plan de pago (`user.premium`).
 */
export type BackendAccountType = "DATING" | "SOCIAL" | "BOTH"

/** Mapea valores legados o vacíos a un enum que Spring pueda deserializar. */
export function toBackendAccountType(
  raw: string | null | undefined
): BackendAccountType {
  const u = String(raw ?? "")
    .trim()
    .toUpperCase()
  if (u === "DATING" || u === "SOCIAL" || u === "BOTH") return u
  if (u === "FREE") return "SOCIAL"
  if (u === "PREMIUM") return "BOTH"
  return "BOTH"
}

/** Mapea valores UI de experiencia a AccountType del backend. */
export function experienceObjectiveToAccountType(
  objective: "social" | "connection" | "both"
): BackendAccountType {
  if (objective === "social") return "SOCIAL"
  if (objective === "connection") return "DATING"
  return "BOTH"
}

/** Etiquetas cortas para mostrar el modo de cuenta en perfil (no es el plan premium). */
export function accountTypeBadgeLabels(at: BackendAccountType): {
  emoji: string
  labelEs: string
  labelEn: string
} {
  switch (at) {
    case "DATING":
      return { emoji: "💕", labelEs: "Citas", labelEn: "Dating" }
    case "SOCIAL":
      return { emoji: "💬", labelEs: "Social", labelEn: "Social" }
    default:
      return { emoji: "✨", labelEs: "Mixto", labelEn: "Mixed" }
  }
}
