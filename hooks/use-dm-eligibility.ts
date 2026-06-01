"use client"

import { useCallback, useEffect, useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import {
  fetchEligibility,
  getViewerContext,
  type EligibilityResult,
  type SparkdViewerContext,
} from "@/lib/dm-eligibility"

type UseDmEligibilityOptions = {
  targetUserId: string | undefined
  /** Override auto-detected context from route */
  context?: SparkdViewerContext
  receiverPrivateAndNotFollowing?: boolean
  enabled?: boolean
}

export function useDmEligibility({
  targetUserId,
  context: contextOverride,
  receiverPrivateAndNotFollowing,
  enabled = true,
}: UseDmEligibilityOptions) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const context =
    contextOverride ?? getViewerContext(pathname, searchParams)

  const [eligibility, setEligibility] = useState<EligibilityResult | null>(null)
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!enabled || !targetUserId) {
      setEligibility(null)
      return
    }
    setLoading(true)
    try {
      const result = await fetchEligibility(targetUserId, context, {
        receiverPrivateAndNotFollowing,
      })
      setEligibility(result)
    } finally {
      setLoading(false)
    }
  }, [enabled, targetUserId, context, receiverPrivateAndNotFollowing])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { eligibility, loading, context, refresh }
}
