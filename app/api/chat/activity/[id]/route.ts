import { NextResponse } from "next/server"
import { getChatActivity, appendChatActivity } from "@/lib/server/chat-context-store"
import { resolveChatContext } from "@/lib/server/chat-context-resolve"
import type { ChatActivityEntry, ChatActivityResponse } from "@/lib/types/context-aware-chat"

export const runtime = "nodejs"

function synthEntries(
  chatId: string,
  participantCount: number,
  title: string
): ChatActivityEntry[] {
  const now = Date.now()
  return [
    {
      id: `syn-${chatId}-1`,
      kind: "momentum",
      text:
        participantCount > 2
          ? `${participantCount} people are active in this chat`
          : "2 people — perfect size to lock a plan",
      occurred_at: new Date(now - 120_000).toISOString(),
    },
    {
      id: `syn-${chatId}-2`,
      kind: "presence",
      text: "Someone is viewing this thread now",
      occurred_at: new Date(now - 45_000).toISOString(),
    },
    {
      id: `syn-${chatId}-3`,
      kind: "join",
      text: `Momentum on “${title.slice(0, 48)}${title.length > 48 ? "…" : ""}”`,
      occurred_at: new Date(now - 10_000).toISOString(),
    },
  ]
}

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
  const ctx = resolveChatContext({ chatId, searchParams: url.searchParams })
  let entries = getChatActivity(chatId)
  if (entries.length === 0) {
    const synth = synthEntries(chatId, ctx.participant_count, ctx.context_title)
    for (const e of [...synth].reverse()) {
      appendChatActivity(chatId, { kind: e.kind, text: e.text, id: e.id })
    }
    entries = getChatActivity(chatId)
  }

  const body: ChatActivityResponse = {
    chat_id: chatId,
    entries,
    active_in_chat_hint:
      ctx.participant_count > 2
        ? `${Math.min(ctx.participant_count, 12)} people engaged recently`
        : "You’re in a direct coordination thread",
    generated_at: new Date().toISOString(),
  }

  return NextResponse.json(body, {
    headers: { "Cache-Control": "private, no-store" },
  })
}
