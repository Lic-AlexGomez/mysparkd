/** Reglas de username (alineadas con backend). */
export const USERNAME_MIN_LENGTH = 3
export const USERNAME_MAX_LENGTH = 30

/** Solo ASCII; . y _ solo en medio; sin acentos ni ñ. */
export const USERNAME_FORMAT_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9._]*[a-zA-Z0-9]$/

export const USERNAME_FORMAT_HINT =
  "3–30 caracteres: letras sin acento, números; punto o guion bajo solo en medio."

/** `null` si es válido; mensaje para toast/alert si no. */
export function getUsernameFormatError(raw: string): string | null {
  const u = raw.trim()
  if (u.length < USERNAME_MIN_LENGTH) {
    return `El usuario debe tener al menos ${USERNAME_MIN_LENGTH} caracteres`
  }
  if (u.length > USERNAME_MAX_LENGTH) {
    return `Máximo ${USERNAME_MAX_LENGTH} caracteres`
  }
  if (!USERNAME_FORMAT_REGEX.test(u)) {
    return "Solo letras (a-z), números, punto y guion bajo en medio; sin acentos, ñ, ni . o _ al inicio o final"
  }
  return null
}
