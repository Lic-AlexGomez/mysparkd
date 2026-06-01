import { api } from "@/lib/api"
import type { PostBoostInfo } from "@/lib/types"

function normalizeBoostInfo(raw: Record<string, unknown>): PostBoostInfo {
  const cents = Number(raw.nextBoostPriceCents ?? 299)
  const usd =
    typeof raw.nextBoostPriceUsd === "number"
      ? raw.nextBoostPriceUsd
      : cents / 100

  return {
    postId: String(raw.postId ?? ""),
    permanent: Boolean(raw.permanent),
    feedActive: Boolean(raw.feedActive),
    expiresAt: raw.expiresAt != null ? String(raw.expiresAt) : null,
    timeUntilExpiry: String(raw.timeUntilExpiry ?? ""),
    boostCount: Number(raw.boostCount ?? 0),
    nextBoostPriceCents: cents,
    nextBoostPriceUsd: usd,
  }
}

export function formatBoostPriceUsd(info: PostBoostInfo): string {
  return `$${info.nextBoostPriceUsd.toFixed(2)}`
}

export async function getPostBoostInfo(postId: string): Promise<PostBoostInfo> {
  const raw = await api.get<Record<string, unknown>>(`/api/posts/${postId}/boost/info`)
  return normalizeBoostInfo(raw)
}

export async function startPostBoostCheckout(postId: string): Promise<string> {
  const url = await api.post<string>(`/api/posts/${postId}/boost/checkout`)
  return typeof url === "string" ? url.trim() : String(url ?? "").trim()
}
