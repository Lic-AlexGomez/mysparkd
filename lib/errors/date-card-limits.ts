import { ApiError } from "@/lib/api"
import { toast } from "sonner"

/**
 * Muestra el mensaje del backend para 403 (límites de citas / interés en Fast Date).
 * @returns true si se trató un 403 (el usuario ya vio un toast)
 */
export function handleDateCardLimitError(error: unknown): boolean {
  if (error instanceof ApiError && error.status === 403) {
    if (error.details) {
      toast.error(error.message, { description: error.details })
    } else {
      toast.error(error.message)
    }
    return true
  }
  return false
}
