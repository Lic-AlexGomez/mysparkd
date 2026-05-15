import { NextResponse } from "next/server"
import { resolveChatContext } from "@/lib/server/chat-context-resolve"

export const runtime = "nodejs"

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const { id } = await Promise.resolve(context.params)
  const chatId = String(id || "").trim()
  if (!chatId) {
    return NextResponse.json({ error: "chat id required" }, { status: 400 })
  }

  const url = new URL(request.url)
  const body = resolveChatContext({ chatId, searchParams: url.searchParams })

  return NextResponse.json(body, {
    headers: { "Cache-Control": "private, max-age=15" },
  })
}
