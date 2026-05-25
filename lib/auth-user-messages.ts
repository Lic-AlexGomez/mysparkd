import { ApiError, rateLimitHint } from "@/lib/api"

export type AuthErrorContext = "login" | "register" | "google" | "passkey" | "forgot-password" | "verify-email"

export type AuthErrorPresentation = {
  title: string
  message: string
  /** Redirigir a verificación de correo tras mostrar el mensaje */
  redirectToVerify?: { username?: string; email?: string }
}

function isGenericProblemLabel(s: string): boolean {
  const t = s.trim().toLowerCase()
  return (
    t === "error" ||
    t === "bad request" ||
    t === "internal server error" ||
    t === "conflict" ||
    t === "unauthorized"
  )
}

function looksLikeServerExceptionMessage(s: string): boolean {
  return /cannot invoke|org\.springframework|java\.lang|javax\.|because\s+["']?[\w.]+["']?\s+is\s+null|at\s+[\w.$]+\(/i.test(
    s
  )
}

function isEmailVerificationIssue(message: string): boolean {
  const lower = message.toLowerCase()
  return (
    lower.includes("verify") ||
    lower.includes("verific") ||
    lower.includes("not verified") ||
    lower.includes("no verific") ||
    (lower.includes("email") &&
      (lower.includes("confirm") ||
        lower.includes("pendiente") ||
        lower.includes("activ") ||
        lower.includes("valid")))
  )
}

function isNetworkIssue(err: unknown): boolean {
  if (!(err instanceof Error)) return false
  const m = err.message.toLowerCase()
  return (
    m.includes("failed to fetch") ||
    m.includes("network") ||
    m.includes("load failed") ||
    err.name === "TypeError"
  )
}

function defaultTitle(context: AuthErrorContext): string {
  switch (context) {
    case "login":
      return "No se pudo iniciar sesión"
    case "register":
      return "No se pudo crear la cuenta"
    case "google":
      return "Error con Google"
    case "passkey":
      return "Error con passkey"
    case "forgot-password":
      return "No se pudo enviar el correo"
    case "verify-email":
      return "Verificación fallida"
    default:
      return "Algo salió mal"
  }
}

function sanitizeApiMessage(message: string, status: number, context: AuthErrorContext): string {
  const trimmed = message.trim()
  if (!trimmed) return ""

  if (looksLikeServerExceptionMessage(trimmed) || (status >= 500 && isGenericProblemLabel(trimmed))) {
    if (context === "register" && status === 409) {
      return "Ese usuario o correo no está disponible. Prueba con otros datos o espera unos minutos."
    }
    if (status >= 500) {
      return "El servidor no respondió correctamente. Revisa tu conexión e inténtalo en unos minutos."
    }
    return ""
  }

  if (context === "login" && status === 401 && isGenericProblemLabel(trimmed)) {
    return "Usuario o contraseña incorrectos."
  }

  if (context === "login" && status === 401) {
    return trimmed
  }

  if (isGenericProblemLabel(trimmed)) {
    return ""
  }

  return trimmed
}

/** Mensaje amigable para mostrar en toast/alert (web y móvil). */
export function resolveAuthError(
  err: unknown,
  context: AuthErrorContext,
  opts?: { username?: string; email?: string }
): AuthErrorPresentation {
  const title = defaultTitle(context)

  if (err instanceof ApiError) {
    if (err.status === 429) {
      return { title: "Demasiados intentos", message: rateLimitHint(err) }
    }

    const raw = err.message?.trim() ?? ""
    const sanitized = sanitizeApiMessage(raw, err.status, context)

    if (context === "login" && isEmailVerificationIssue(raw || sanitized)) {
      return {
        title: "Verifica tu correo",
        message:
          sanitized ||
          raw ||
          "Debes verificar tu correo antes de iniciar sesión.",
        redirectToVerify: {
          username: opts?.username,
          email: opts?.email,
        },
      }
    }

    if (sanitized) {
      return { title, message: sanitized }
    }

    if (err.status === 409 && context === "register") {
      return {
        title,
        message:
          "Ese usuario o correo ya está en uso o hay una solicitud reciente. Prueba con otros datos.",
      }
    }

    if (err.status === 401 && context === "login") {
      return { title, message: "Usuario o contraseña incorrectos." }
    }

    if (err.status === 403) {
      return {
        title: "Acceso denegado",
        message: raw || "No tienes permiso para esta acción.",
      }
    }

    if (err.status >= 500) {
      return {
        title,
        message: "El servidor no respondió correctamente. Inténtalo más tarde.",
      }
    }

    return {
      title,
      message: raw || "No se pudo completar la solicitud. Inténtalo de nuevo.",
    }
  }

  if (isNetworkIssue(err)) {
    return {
      title: "Sin conexión",
      message: "No pudimos conectar con el servidor. Revisa tu internet e inténtalo de nuevo.",
    }
  }

  if (err instanceof Error && err.message.trim()) {
    const msg = err.message.trim()
    if (looksLikeServerExceptionMessage(msg)) {
      return {
        title,
        message: "Ocurrió un error inesperado. Inténtalo de nuevo.",
      }
    }
    if (context === "login" && isEmailVerificationIssue(msg)) {
      return {
        title: "Verifica tu correo",
        message: msg,
        redirectToVerify: { username: opts?.username, email: opts?.email },
      }
    }
    return { title, message: msg }
  }

  return {
    title,
    message: "Ocurrió un error inesperado. Inténtalo de nuevo.",
  }
}

export function showAuthErrorToast(
  present: AuthErrorPresentation,
  toast: { error: (msg: string) => void }
): void {
  const text = present.title === present.message ? present.message : `${present.title}: ${present.message}`
  toast.error(text)
}
