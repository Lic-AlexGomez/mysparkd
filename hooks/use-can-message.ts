"use client"

/**
 * @deprecated Prefer useDmEligibility — mantiene compatibilidad.
 */
import { useDmEligibility } from "@/hooks/use-dm-eligibility"
import type { SparkdViewerContext } from "@/lib/dm-eligibility"

type UseCanMessageOptions = {
  targetUserId: string | undefined
  context?: SparkdViewerContext
  prefetchedContext?: { receiverPrivateAndNotFollowing?: boolean } | null
  enabled?: boolean
}

export function useCanMessage(opts: UseCanMessageOptions) {
  const { eligibility, loading, refresh } = useDmEligibility({
    targetUserId: opts.targetUserId,
    context: opts.context,
    receiverPrivateAndNotFollowing: opts.prefetchedContext?.receiverPrivateAndNotFollowing,
    enabled: opts.enabled,
  })

  const result = eligibility
    ? {
        allowed: eligibility.canOpenDm,
        reason: eligibility.reason,
        messageKey: eligibility.canOpenDm
          ? undefined
          : eligibility.reason === "DATING_MATCH_REQUIRED"
            ? "dm.datingMatchRequired"
            : eligibility.reason === "SOCIAL_MUTUAL_FOLLOW_REQUIRED"
              ? "dm.socialMutualFollowRequired"
              : "contact.datingExposureNoMatch",
      }
    : null

  return { result, loading, refresh }
}
