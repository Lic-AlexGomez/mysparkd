import { NextResponse } from "next/server"
import { decodeJwtUserId } from "@/lib/server/jwt-payload-user"
import { appendChatActivity } from "@/lib/server/chat-context-store"
import { applyLinkContext } from "@/lib/server/chat-context-resolve"
import type { ChatActionPayload, ChatClientAction } from "@/lib/types/context-aware-chat"

export const runtime = "nodejs"

const ACTIONS: ChatClientAction[] = [
  "view_event",
  "join_plan",
  "invite_friends",
  "convert_meetup",
  "start_fast_date",
  "link_context",
]

export async function POST(request: Request) {
  const auth = request.headers.get("authorization")
  const viewer = decodeJwtUserId(auth)
  if (!viewer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: ChatActionPayload
  try {
    body = (await request.json()) as ChatActionPayload
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const chatId = String(body.chat_id || "").trim()
  if (!chatId) {
    return NextResponse.json({ error: "chat_id required" }, { status: 400 })
  }
  if (!body.action || !ACTIONS.includes(body.action)) {
    return NextResponse.json({ error: "invalid action" }, { status: 400 })
  }

  if (body.action === "link_context") {
    const ctx = applyLinkContext(chatId, {
      chat_type: body.chat_type,
      context_id: body.context_id,
      context_title: body.context_title,
      location: body.location,
      activity_status: body.activity_status,
      participant_count: body.participant_count,
    })
    return NextResponse.json({ ok: true, message: "context_linked", context: ctx })
  }

  const labels: Record<ChatClientAction, string> = {
    view_event: "Opened event from chat",
    join_plan: "Join plan tapped",
    invite_friends: "Invite friends tapped",
    convert_meetup: "Convert to meetup tapped",
    start_fast_date: "Start Fast Date tapped",
    link_context: "",
  }
  appendChatActivity(chatId, { kind: "system", text: labels[body.action] })

  return NextResponse.json({
    ok: true,
    message: body.action,
    deeplink:
      body.action === "view_event" && body.context_id
        ? `/events/${encodeURIComponent(body.context_id)}`
        : body.action === "join_plan"
          ? "/events"
          : body.action === "invite_friends"
            ? "/events"
            : body.action === "convert_meetup"
              ? "/events?explore=meetup"
              : body.action === "start_fast_date"
                ? "/events?explore=fastdate"
                : "/chat",
  })
}
