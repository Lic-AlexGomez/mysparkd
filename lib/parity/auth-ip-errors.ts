/** Detecta errores de registro/login por límite de IP (backend Sparkd). */
export function isIpRegistrationBlockedMessage(message: string): boolean {
  const lower = message.toLowerCase()
  return (
    lower.includes("ip address") ||
    lower.includes("ip address") ||
    lower.includes("same ip") ||
    lower.includes("misma ip") ||
    lower.includes("exceeded register") ||
    lower.includes("registro") && lower.includes("ip") ||
    lower.includes("too many accounts") ||
    lower.includes("demasiadas cuentas")
  )
}

export function ipRegistrationBlockedPresentation(): { title: string; message: string } {
  return {
    title: "Límite de registros",
    message:
      "Ya se creó una cuenta recientemente desde esta red. Espera unos minutos o usa otra conexión.",
  }
}
