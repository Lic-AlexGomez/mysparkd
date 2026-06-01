import type { DateCardStatus, MyDateCard } from "@/lib/types"

export interface MyDateCardsGrouped {
  activeCards: MyDateCard[]
  expiredCards: MyDateCard[]
}

const ACTIVE: DateCardStatus[] = ["ACTIVE", "OPEN"]

export function parseMyDateCardsMineResponse(raw: unknown): MyDateCardsGrouped {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const o = raw as Record<string, unknown>
    if ("activeCards" in o || "expiredCards" in o) {
      return {
        activeCards: Array.isArray(o.activeCards) ? (o.activeCards as MyDateCard[]) : [],
        expiredCards: Array.isArray(o.expiredCards) ? (o.expiredCards as MyDateCard[]) : [],
      }
    }
  }
  const flat = Array.isArray(raw) ? (raw as MyDateCard[]) : []
  return {
    activeCards: flat.filter((c) => ACTIVE.includes(String(c.status || "").toUpperCase() as DateCardStatus)),
    expiredCards: flat.filter((c) => !ACTIVE.includes(String(c.status || "").toUpperCase() as DateCardStatus)),
  }
}
