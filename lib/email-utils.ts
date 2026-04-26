/** Normaliza email para comparar o enviar (misma lógica que el backend: trim + minúsculas). */
export function normalizeEmailValue(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, "")
    .normalize("NFC")
}
