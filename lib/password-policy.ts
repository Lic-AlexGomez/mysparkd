/** Requisitos de contraseña en registro (alineados con política de producto). */
export const REGISTRATION_PASSWORD_HINT =
  "Mínimo 8 caracteres: incluye mayúscula, minúscula, número y símbolo."

export type PasswordRuleId = "length" | "upper" | "lower" | "digit" | "symbol"

export interface PasswordRuleCheck {
  id: PasswordRuleId
  label: string
  ok: boolean
}

export function checkRegistrationPasswordRules(password: string): PasswordRuleCheck[] {
  return [
    {
      id: "length",
      label: "Al menos 8 caracteres",
      ok: password.length >= 8,
    },
    {
      id: "upper",
      label: "Una mayúscula",
      ok: /[A-Z]/.test(password),
    },
    {
      id: "lower",
      label: "Una minúscula",
      ok: /[a-z]/.test(password),
    },
    {
      id: "digit",
      label: "Un número",
      ok: /[0-9]/.test(password),
    },
    {
      id: "symbol",
      label: "Un símbolo (!@#$…)",
      ok: /[^A-Za-z0-9]/.test(password),
    },
  ]
}

/** `null` si es válida; string con el primer fallo para toasts. */
export function getRegistrationPasswordError(password: string): string | null {
  const rules = checkRegistrationPasswordRules(password)
  const failed = rules.find((r) => !r.ok)
  if (!failed) return null
  const messages: Record<PasswordRuleId, string> = {
    length: "La contraseña debe tener al menos 8 caracteres",
    upper: "Incluye al menos una letra mayúscula",
    lower: "Incluye al menos una letra minúscula",
    digit: "Incluye al menos un número",
    symbol: "Incluye al menos un símbolo (! @ # $ …)",
  }
  return messages[failed.id]
}
