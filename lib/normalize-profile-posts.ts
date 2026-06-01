import { applyLockedPostFields } from "@/lib/locked-post-preview"
import type { Poll, Post, ReactionType } from "@/lib/types"

/** Alinea campos opcionales que el perfil puede devolver distinto al feed (poll vote, reacción del viewer). */
export function normalizeProfilePosts(posts: Post[] | undefined | null): Post[] {
  if (!Array.isArray(posts) || posts.length === 0) return posts ?? []

  return posts.map((raw) => {
    const p = raw as Post & Record<string, unknown>
    const urSnake =
      typeof p.user_reaction === "string" ? (p.user_reaction as ReactionType) : undefined
    const userReaction = (p.userReaction as ReactionType | null | undefined) ?? urSnake ?? null

    let poll: Poll | null | undefined = p.poll ?? null
    if (poll && typeof poll === "object") {
      const pol = poll as Poll & { myVoteOptionId?: string }
      const userVoted = pol.userVoted ?? pol.myVoteOptionId ?? null
      poll = { ...pol, userVoted }
    }

    const next = {
      ...p,
      userReaction: userReaction ?? undefined,
      poll,
    }
    if (!next.file && next.media?.mediaUrl) {
      next.file = next.media.mediaUrl
    }
    return applyLockedPostFields(next)
  })
}
