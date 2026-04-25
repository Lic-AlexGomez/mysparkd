const TRELLO_BASE_URL = "https://api.trello.com/1"

function getCredentials() {
  const key = process.env.TRELLO_API_KEY
  const token = process.env.TRELLO_TOKEN
  if (!key || !token) {
    throw new Error("Missing Trello credentials: set TRELLO_API_KEY and TRELLO_TOKEN")
  }
  return { key, token }
}

async function handler(
  request: Request,
  context: { params: Promise<{ path: string[] }> | { path: string[] } }
) {
  const { key, token } = getCredentials()
  const params = await Promise.resolve(context.params)
  const path = params.path || []

  if (path.length === 0) {
    return Response.json({ error: "Trello path is required" }, { status: 400 })
  }

  const incomingUrl = new URL(request.url)
  const targetUrl = new URL(`${TRELLO_BASE_URL}/${path.join("/")}`)

  // Forward incoming query params, then enforce credentials.
  incomingUrl.searchParams.forEach((value, param) => {
    targetUrl.searchParams.set(param, value)
  })
  targetUrl.searchParams.set("key", key)
  targetUrl.searchParams.set("token", token)

  const headers = new Headers()
  const contentType = request.headers.get("content-type")
  if (contentType) headers.set("content-type", contentType)

  let body: BodyInit | undefined
  if (request.method !== "GET" && request.method !== "HEAD") {
    body = await request.text()
  }

  try {
    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
    })

    if (response.status === 204) {
      return new Response(null, { status: 204 })
    }

    const responseHeaders = new Headers()
    const responseContentType = response.headers.get("content-type")
    if (responseContentType) {
      responseHeaders.set("content-type", responseContentType)
    }

    const buffer = await response.arrayBuffer()
    return new Response(buffer, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    })
  } catch (error) {
    console.error("[trello-proxy] request failed", error)
    return Response.json({ error: "Failed to reach Trello API" }, { status: 502 })
  }
}

export const GET = handler
export const POST = handler
export const PUT = handler
export const PATCH = handler
export const DELETE = handler

