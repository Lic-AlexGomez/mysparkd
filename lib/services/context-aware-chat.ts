import type {
  ChatActionPayload,
  ChatActionResponse,
  ChatActivityResponse,
  ChatContextResponse,
} from "@/lib/types/context-aware-chat"

function authHeaders(): HeadersInit {
  const token =
    typeof window !== "undefined" ? window.localStorage.getItem("sparkd_token") : null
  const h: HeadersInit = { Accept: "application/json" }
  if (token) (h as Record<string, string>).Authorization = `Bearer ${token}`
  return h
}

export function buildChatContextUrl(chatId: string, search: string): string {
  const q = search.startsWith("?") ? search.slice(1) : search
  return `/api/chat/context/${encodeURIComponent(chatId)}${q ? `?${q}` : ""}`
}

export function buildChatActivityUrl(chatId: string, search: string): string {
  const q = search.startsWith("?") ? search.slice(1) : search
  return `/api/chat/activity/${encodeURIComponent(chatId)}${q ? `?${q}` : ""}`
}

export const contextAwareChatService = {
  getContext(chatId: string, search: string): Promise<ChatContextResponse> {
    return fetch(buildChatContextUrl(chatId, search), { headers: authHeaders() }).then(async (r) => {
      if (!r.ok) throw new Error(await r.text())
      return r.json() as Promise<ChatContextResponse>
    })
  },

  getActivity(chatId: string, search: string): Promise<ChatActivityResponse> {
    return fetch(buildChatActivityUrl(chatId, search), { headers: authHeaders() }).then(async (r) => {
      if (!r.ok) throw new Error(await r.text())
      return r.json() as Promise<ChatActivityResponse>
    })
  },

  postAction(body: ChatActionPayload): Promise<ChatActionResponse> {
    return fetch("/api/chat/action", {
      method: "POST",
      headers: {
        ...authHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }).then(async (r) => {
      if (!r.ok) throw new Error(await r.text())
      return r.json() as Promise<ChatActionResponse>
    })
  },
}
