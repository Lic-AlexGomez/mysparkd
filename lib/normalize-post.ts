import type { Post, ReactionType } from "@/lib/types"
import { applyLockedPostFields } from "@/lib/locked-post-preview"

type RawPost = Record<string, unknown>

function buildReactions(post: RawPost): Post["reactions"] {
  const reactionsObj: Record<string, { type: string; count: number; userReacted: boolean }> =
    {}
  if (Array.isArray(post.reactions)) {
    ;(post.reactions as { reaction: string; count: number }[]).forEach((r) => {
      reactionsObj[r.reaction] = {
        type: r.reaction,
        count: r.count,
        userReacted: post.myReaction === r.reaction,
      }
    })
  }
  return reactionsObj
}

function buildPoll(post: RawPost): Post["poll"] {
  const p = post.poll as Record<string, unknown> | undefined
  if (!p || typeof p !== "object") return null
  const options = (p.options as Record<string, unknown>[]) || []
  const totalVotes = options.reduce(
    (sum, o) => sum + Number(o.voteCount ?? 0),
    0
  )
  return {
    id: String(p.pollId ?? ""),
    question: String(p.question ?? ""),
    options: options.map((o) => ({
      id: String(o.id ?? ""),
      text: String(o.text ?? ""),
      votes: Number(o.voteCount ?? 0),
      percentage: Number(o.percentage ?? 0),
    })),
    totalVotes,
    expiresAt: String(p.expiresAt ?? new Date().toISOString()),
    userVoted: (p.myVoteOptionId as string) || null,
    allowMultiple: false,
  }
}

/** Normaliza un post del backend para PostCard y el feed. */
export function normalizePost(raw: unknown): Post {
  const post =
    raw && typeof raw === "object" && "post" in (raw as object) && (raw as RawPost).post
      ? ((raw as RawPost).post as RawPost)
      : (raw as RawPost)

  const base: Post = {
    id:
      post.id != null
        ? String(post.id)
        : post.postId != null
          ? String(post.postId)
          : "",
    body: String(post.body ?? ""),
    userId: post.userId ? String(post.userId) : "",
    username: String(post.username || "Usuario"),
    userPhoto: String(post.profilePictureUrl || post.userPhoto || ""),
    createdAt: String(post.createdAt || new Date().toISOString()),
    file: (post.file as string) || null,
    visibility: (post.visibility as Post["visibility"]) || "PUBLIC",
    likeCount: Number(post.likeCount ?? 0),
    commentsCount: Number(post.commentsCount ?? post.commentCount ?? 0),
    viewCount: Number(post.viewCount ?? 0),
    shareCount: Number(post.shareCount ?? 0),
    liked: Boolean(post.likedByCurrentUser ?? post.liked ?? false),
    saved: Boolean(post.saved ?? false),
    userReaction: (post.myReaction as ReactionType) || null,
    reactions: buildReactions(post),
    locked: Boolean(post.locked ?? false),
    canUnlock: Boolean(post.canUnlock ?? false),
    unlocked:
      post.unlocked !== undefined && post.unlocked !== null
        ? Boolean(post.unlocked)
        : !Boolean(post.locked ?? false),
    permanent: post.permanent !== false,
    expiresAt: (post.expiresAt as string) || null,
    message: (post.message as string) || null,
    reputation: post.reputation as number | undefined,
    verificationLevel: post.verificationLevel as number | undefined,
    repostCount: Number(post.repostCount ?? 0),
    repostedByCurrentUser: Boolean(post.repostedByCurrentUser ?? false),
    media: (post.media as Post["media"]) || null,
    poll: buildPoll(post),
  }

  if (!base.file && base.media?.mediaUrl) {
    base.file = base.media.mediaUrl
  }

  return applyLockedPostFields(base) as Post
}

/** Posts que no deben mostrarse en el feed (p. ej. sin acceso). Los premium bloqueados sí se muestran. */
export function isDisplayableFeedPost(post: Post): boolean {
  if (post.locked && !post.unlocked) return true
  return !(post.message && !post.body && !post.file)
}
