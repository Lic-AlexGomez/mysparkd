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
