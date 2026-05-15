import type {
  GraphUpdatePayload,
  GraphUpdateResponse,
  RecommendationsResponse,
  SimilarityResponse,
} from "@/lib/types/recommendation-graph-v2"

function authHeaders(): HeadersInit {
  const token =
    typeof window !== "undefined" ? window.localStorage.getItem("sparkd_token") : null
  const h: HeadersInit = { Accept: "application/json" }
  if (token) (h as Record<string, string>).Authorization = `Bearer ${token}`
  return h
}

export const recommendationGraphV2Service = {
  getForUser(userId: string): Promise<RecommendationsResponse> {
    return fetch(`/api/recommendations/user/${encodeURIComponent(userId)}`, {
      headers: authHeaders(),
    }).then(async (r) => {
      if (!r.ok) throw new Error(await r.text())
      return r.json() as Promise<RecommendationsResponse>
    })
  },

  postGraphUpdate(body: GraphUpdatePayload): Promise<GraphUpdateResponse> {
    return fetch("/api/graph/update", {
      method: "POST",
      headers: {
        ...authHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }).then(async (r) => {
      if (!r.ok) throw new Error(await r.text())
      return r.json() as Promise<GraphUpdateResponse>
    })
  },

  getSimilarity(userId: string): Promise<SimilarityResponse> {
    return fetch(`/api/graph/similarity/${encodeURIComponent(userId)}`, {
      headers: authHeaders(),
    }).then(async (r) => {
      if (!r.ok) throw new Error(await r.text())
      return r.json() as Promise<SimilarityResponse>
    })
  },
}
