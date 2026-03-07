const API_BASE_URL = "/api/proxy"

class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
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
  window.location.href = "/login"
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

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (response.status === 401) {
    clearAuth()
    throw new ApiError("No autorizado", 401)
  }

  if (response.status === 204) {
    return undefined as T
  }

  if (!response.ok) {
    let message = "Error del servidor"
    try {
      const errorData = await response.json()
      message = errorData.message || errorData.error || message
    } catch {
      try {
        message = await response.text()
      } catch {
        // keep default
      }
    }
    throw new ApiError(message, response.status)
  }

  const contentType = response.headers.get("content-type")
  if (contentType && contentType.includes("application/json")) {
    return response.json()
  }

  return (await response.text()) as T
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint, { method: "GET" }),

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
}

export { ApiError }
