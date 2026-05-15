import type {
  LoopInsightsResponse,
  LoopTrackPayload,
  LoopTrackResponse,
  LoopTriggerPayload,
  LoopTriggerResponse,
} from "@/lib/types/conversion-loop"

function authHeaders(): HeadersInit {
  const token =
    typeof window !== "undefined" ? window.localStorage.getItem("sparkd_token") : null
  const h: HeadersInit = { Accept: "application/json" }
  if (token) (h as Record<string, string>).Authorization = `Bearer ${token}`
  return h
}

export const conversionLoopService = {
  track(body: LoopTrackPayload): Promise<LoopTrackResponse> {
    return fetch("/api/loop/track", {
      method: "POST",
      headers: {
        ...authHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }).then(async (r) => {
      if (!r.ok) throw new Error(await r.text())
      return r.json() as Promise<LoopTrackResponse>
    })
  },

  getInsights(userId: string): Promise<LoopInsightsResponse> {
    return fetch(`/api/loop/insights/${encodeURIComponent(userId)}`, {
      headers: authHeaders(),
    }).then(async (r) => {
      if (!r.ok) throw new Error(await r.text())
      return r.json() as Promise<LoopInsightsResponse>
    })
  },

  trigger(body: LoopTriggerPayload = {}): Promise<LoopTriggerResponse> {
    return fetch("/api/loop/trigger", {
      method: "POST",
      headers: {
        ...authHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }).then(async (r) => {
      if (!r.ok) throw new Error(await r.text())
      return r.json() as Promise<LoopTriggerResponse>
    })
  },
}
