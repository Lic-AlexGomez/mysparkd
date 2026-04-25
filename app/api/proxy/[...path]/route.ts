const normalizeBackend = (raw: string) =>
  raw.replace(/\/api\/?$/, "").replace(/\/$/, "")

const PRIMARY_BACKEND_URL = normalizeBackend(
  process.env.NEXT_PUBLIC_API_URL || "https://sparkd1-0.onrender.com"
)
const EVENTS_READONLY_BACKEND_URL = normalizeBackend(
  process.env.NEXT_PUBLIC_READONLY_EVENTS_API_URL || PRIMARY_BACKEND_URL
)

async function handler(
  request: Request,
  context: { params: Promise<{ path: string[] }> | { path: string[] } }
) {
  const params = await Promise.resolve(context.params)
  const { path } = params
  const endpoint = `/${path.join("/")}`

  // Rule:
  // - GET /api/events... -> readonly events backend
  // - Any non-GET method (POST/PUT/PATCH/DELETE) -> primary backend
  const isEventsPath = endpoint.startsWith("/api/events")
  const useReadonlyEventsBackend = request.method === "GET" && isEventsPath
  const selectedBackend = useReadonlyEventsBackend
    ? EVENTS_READONLY_BACKEND_URL
    : PRIMARY_BACKEND_URL

  const url = new URL(request.url)
  const queryString = url.search
  const targetUrl = `${selectedBackend}${endpoint}${queryString}`

  const headers: Record<string, string> = {
    "Accept": "*/*"
  }
  
  const authHeader = request.headers.get("authorization")
  if (authHeader) headers["Authorization"] = authHeader

  const contentType = request.headers.get("content-type")

  let body: BodyInit | undefined = undefined
  if (request.method !== "GET" && request.method !== "HEAD") {
    try {
      if (contentType?.includes("multipart/form-data")) {
        // Reenviar el body crudo como ArrayBuffer para preservar el boundary original
        body = await request.arrayBuffer()
        headers["Content-Type"] = contentType
      } else {
        body = await request.text()
        if (body) headers["Content-Type"] = "application/json"
      }
    } catch {
      // no body
    }
  }

  if (process.env.NODE_ENV === 'development') {
    if (endpoint.includes('/chat')) {
      console.log(`[chat] ${request.method} ${endpoint}`, {
        contentType,
        body: typeof body === 'string' ? body : body instanceof FormData ? '[FormData]' : body
      })
    }
  }

  try {
    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body: body || undefined,
    })

    const responseHeaders = new Headers()
    const respContentType = response.headers.get("content-type")
    if (respContentType) {
      responseHeaders.set("content-type", respContentType)
    }

    // Cache para GETs — reduce llamadas repetidas al backend
    if (request.method === 'GET' && response.status === 200) {
      if (endpoint.includes('/profile/')) {
        responseHeaders.set('Cache-Control', 'private, max-age=30')
      } else if (endpoint.includes('/notifications') || endpoint.includes('/chat/chats')) {
        responseHeaders.set('Cache-Control', 'private, max-age=10')
      } else if (endpoint.includes('/feed') || endpoint.includes('/posts')) {
        responseHeaders.set('Cache-Control', 'private, max-age=15')
      }
    }

    if (response.status === 204) {
      return new Response(null, {
        status: 204,
        headers: responseHeaders,
      })
    }

    const responseBody = await response.arrayBuffer()

    return new Response(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    })
  } catch (error) {
    console.error("[proxy] Error forwarding request:", error)
    return Response.json(
      { error: "Error connecting to backend" },
      { status: 502 }
    )
  }
}

export const GET = handler
export const POST = handler
export const PUT = handler
export const DELETE = handler
export const PATCH = handler
