const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "https://sparkd1-0.onrender.com"

async function handler(
  request: Request,
  context: { params: Promise<{ path: string[] }> | { path: string[] } }
) {
  const params = await Promise.resolve(context.params)
  const { path } = params
  const endpoint = `/${path.join("/")}`

  const url = new URL(request.url)
  const queryString = url.search
  const targetUrl = `${BACKEND_URL}${endpoint}${queryString}`

  const headers: Record<string, string> = {
    "Accept": "*/*"
  }
  
  const authHeader = request.headers.get("authorization")
  if (authHeader) {
    headers["Authorization"] = authHeader
  }

  const contentType = request.headers.get("content-type")
  if (contentType && !contentType.includes("multipart/form-data")) {
    headers["Content-Type"] = contentType
  }

  let body: BodyInit | undefined = undefined
  if (request.method !== "GET" && request.method !== "HEAD") {
    try {
      if (contentType?.includes("multipart/form-data")) {
        body = await request.formData()
      } else {
        body = await request.text()
        // Siempre forzar application/json para body de texto
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

    console.log(`[proxy] ${request.method} ${targetUrl} → ${response.status}`)

    const responseHeaders = new Headers()
    const respContentType = response.headers.get("content-type")
    if (respContentType) {
      responseHeaders.set("content-type", respContentType)
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
