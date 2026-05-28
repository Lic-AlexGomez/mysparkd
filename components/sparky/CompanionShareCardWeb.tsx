"use client"

import { SparkyCharacterWeb } from "@/components/sparky/SparkyCharacterWeb"
import type { CompanionId } from "@/lib/companion/catalog"

type Props = {
  quote: string
  companionId?: CompanionId
}

export function CompanionShareCardWeb({ quote, companionId = "sparky" }: Props) {
  return (
    <div
      id="sparky-share-card"
      className="flex flex-col items-center gap-3 rounded-2xl border bg-card p-6 text-center shadow-md"
    >
      <SparkyCharacterWeb companionId={companionId} expression="celebrating" size={64} />
      <p className="text-lg font-semibold italic">&ldquo;{quote}&rdquo;</p>
      <p className="text-sm font-bold text-primary">— Sparky · Sparkd</p>
    </div>
  )
}
