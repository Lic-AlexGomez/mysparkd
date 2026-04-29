const API_BASE_URL = "/api/proxy"
const REQUEST_TIMEOUT_MS = 20_000

/** Incluye `message` del cuerpo JSON (p. ej. límite 429) y `status` HTTP. */
class ApiError extends Error {
  status: number
  details?: string
  /** Segundos desde cabecera `Retry-After` (solo cuando el servidor lo envía). */
  retryAfterSeconds?: number
  constructor(
    message: string,
    status: number,
    details?: string,
    retryAfterSeconds?: number
  ) {
    super(message)
    this.status = status
    this.details = details
    this.retryAfterSeconds = retryAfterSeconds
    this.name = "ApiError"
  }
}

function getToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("sparkd_token")
}

function clearAuth() {
  if (typeof window === "undefined") return
  localStorage.removeItem("sparkd_token")
  localStorage.removeItem("sparkd_user_id")
  localStorage.removeItem("sparkd_login_account_type")
  window.location.href = "/login"
}

/** Evita mostrar solo "Error" / "Conflict" cuando falta `detail` útil (RFC 7807). */
function isGenericProblemLabel(s: string): boolean {
  const t = s.trim().toLowerCase()
  return (
    t === "error" ||
    t === "bad request" ||
    t === "internal server error" ||
    t === "conflict"
  )
}

/** Texto de excepción Java / Spring poco útil para el usuario final. */
function looksLikeServerExceptionMessage(s: string): boolean {
  return /cannot invoke|org\.springframework|because\s+["']?[\w.]+["']?\s+is\s+null|java\.lang|javax\.|at\s+[\w.$]+\(/i.test(s)
}

/** Mensaje legible desde JSON de error (Spring, Problem+JSON, validación). */
function extractErrorMessageFromBody(
  data: Record<string, unknown>
): string | null {
  const str = (v: unknown) =>
    typeof v === "string" && v.trim() ? v.trim() : null

  // RFC 7807: `detail` describe el fallo; `title` suele ser genérico ("Error").
  const fromDetail = str(data.detail)
  if (fromDetail) return fromDetail

  const fromDescription = str(data.description)
  if (fromDescription) return fromDescription

  const fromReason = str(data.reason)
  if (fromReason) return fromReason

  const fromMessage = str(data.message)
  if (fromMessage && !looksLikeServerExceptionMessage(fromMessage)) {
    return fromMessage
  }

  const fromTitle = str(data.title)
  if (fromTitle && !isGenericProblemLabel(fromTitle)) return fromTitle

  const fromError = str(data.error)
  if (fromError && !/^\d+$/.test(fromError) && !isGenericProblemLabel(fromError)) {
    return fromError
  }

  if (Array.isArray(data.errors) && data.errors.length > 0) {
    const e0 = data.errors[0] as Record<string, unknown>
    const m = str(e0?.defaultMessage) || str(e0?.message)
    if (m) return m
  }
  if (Array.isArray(data.violations) && data.violations.length > 0) {
    const v0 = data.violations[0] as Record<string, unknown>
    const m = str(v0?.message) || str(v0?.description)
    if (m) return m
  }

  // Último recurso: mensaje técnico mejor que nada para depurar (se sustituye si es 5xx abajo).
  if (fromMessage) return fromMessage

  return null
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
  }

  // Solo agregar Content-Type si no es FormData
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json"
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    })
  } catch (error: any) {
    if (error?.name === "AbortError") {
      throw new ApiError("La solicitud tardó demasiado. Intenta nuevamente.", 408)
    }
    throw error
  } finally {
    clearTimeout(timeout)
  }

  if (response.status === 401) {
    clearAuth()
    throw new ApiError("No autorizado", 401)
  }

  if (response.status === 204) {
    return undefined as T
  }

  if (!response.ok) {
    const status = response.status
    let message = ""
    let details: string | undefined
    try {
      const errorData = (await response.json()) as Record<string, unknown>
      message = extractErrorMessageFromBody(errorData) ?? ""
      if (typeof errorData.details === "string" && errorData.details) {
        details = errorData.details
      }
    } catch {
      try {
        const t = (await response.text()).trim()
        if (t && !t.startsWith("<")) message = t.slice(0, 500)
      } catch {
        // ignore
      }
    }
    if (
      status >= 500 &&
      message &&
      (looksLikeServerExceptionMessage(message) || isGenericProblemLabel(message))
    ) {
      message = ""
    }
    if (!message) {
      if (status === 409) {
        message =
          "Ese correo no está disponible: puede estar en uso por otra cuenta, coincidir con tu correo principal, o haber una solicitud reciente. Prueba otro correo o espera unos minutos."
      } else if (status === 429) {
        message =
          "Demasiados intentos en poco tiempo. Espera un momento e inténtalo de nuevo."
      } else {
        message =
          status === 502 || status === 503 || status === 504
            ? "No se pudo conectar con el servidor. Revisa tu conexión o inténtalo más tarde."
            : status >= 500
              ? `El servidor respondió con error (HTTP ${status}). Si estabas configurando el correo, puede ser un fallo temporal o del envío de emails.`
              : `Solicitud no completada (HTTP ${status}).`
      }
    }
    let retryAfterSeconds: number | undefined
    if (status === 429) {
      const ra = response.headers.get("Retry-After")
      if (ra) {
        const sec = parseInt(ra.trim(), 10)
        if (!Number.isNaN(sec) && sec >= 0 && sec <= 86400) {
          retryAfterSeconds = sec
        }
      }
    }
    throw new ApiError(message, status, details, retryAfterSeconds)
  }

  const contentType = response.headers.get("content-type")
  if (contentType && contentType.includes("application/json")) {
    return response.json()
  }

  return (await response.text()) as T
}

export const api = {
  get: <T>(endpoint: string) =>
    request<T>(endpoint, {
      method: "GET",
      // Refuerzo: el proxy ya no cachea /me; el cliente tampoco reutiliza respuestas viejas.
      ...(endpoint.includes("/api/profile/me") ? { cache: "no-store" as RequestCache } : {}),
    }),

  post: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, {
      method: "POST",
      body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    }),

  put: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(endpoint: string) => request<T>(endpoint, { method: "DELETE" }),

  patch: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    }),
}

export { ApiError }
