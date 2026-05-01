import { format, isValid, parseISO } from "date-fns"
import { es } from "date-fns/locale"

/** Etiqueta corta para eje X en gráficas admin (evitar ISO largo). */
export function chartDayLabel(iso: string): string {
  if (!iso?.trim()) return "—"
  try {
    const normalized = iso.includes("T") ? iso : `${iso.slice(0, 10)}T12:00:00`
    const d = parseISO(normalized)
    if (!isValid(d)) return iso.slice(5, 10)
    return format(d, "d MMM", { locale: es })
  } catch {
    return iso.slice(0, 10)
  }
}
