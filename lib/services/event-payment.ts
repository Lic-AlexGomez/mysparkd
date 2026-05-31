import { api } from "@/lib/api"

export type EventTicket = {
  ticketId: string
  eventId: string
  eventTitle?: string
  eventCoverPhotoUrl?: string | null
  eventDate?: string
  eventZone?: string
  creatorUsername?: string
  amountPaid?: number
  currency?: string
  used?: boolean
  purchasedAt?: string
}

function normalizeTicket(raw: Record<string, unknown>): EventTicket | null {
  const ticketId = String(raw.ticketId ?? raw.id ?? "").trim()
  const eventId = String(raw.eventId ?? "").trim()
  if (!ticketId) return null
  return {
    ticketId,
    eventId,
    eventTitle: typeof raw.eventTitle === "string" ? raw.eventTitle : undefined,
    eventCoverPhotoUrl:
      typeof raw.eventCoverPhotoUrl === "string" ? raw.eventCoverPhotoUrl : null,
    eventDate: typeof raw.eventDate === "string" ? raw.eventDate : undefined,
    eventZone: typeof raw.eventZone === "string" ? raw.eventZone : undefined,
    creatorUsername:
      typeof raw.creatorUsername === "string" ? raw.creatorUsername : undefined,
    amountPaid: typeof raw.amountPaid === "number" ? raw.amountPaid : Number(raw.amountPaid) || undefined,
    currency: typeof raw.currency === "string" ? raw.currency : undefined,
    used: raw.used === true,
    purchasedAt: typeof raw.purchasedAt === "string" ? raw.purchasedAt : undefined,
  }
}

export const eventPaymentService = {
  async checkout(eventId: string): Promise<string | null> {
    try {
      const res = await api.post<{ checkoutUrl?: string } | string>(
        `/api/events/payment/${eventId}/checkout`
      )
      if (typeof res === "string" && res.startsWith("http")) return res
      const url = typeof res === "object" && res?.checkoutUrl ? res.checkoutUrl : ""
      return url || null
    } catch {
      return null
    }
  },

  async getMyTickets(): Promise<EventTicket[]> {
    try {
      const rows = await api.get<unknown>("/api/events/payment/tickets/me")
      if (!Array.isArray(rows)) return []
      return rows
        .map((r) => normalizeTicket(r as Record<string, unknown>))
        .filter((t): t is EventTicket => t != null)
    } catch {
      return []
    }
  },

  async getTicket(ticketId: string): Promise<EventTicket | null> {
    try {
      const raw = await api.get<Record<string, unknown>>(
        `/api/events/payment/tickets/${ticketId}`
      )
      return normalizeTicket(raw)
    } catch {
      return null
    }
  },

  findTicketForEvent(tickets: EventTicket[], eventId: string): EventTicket | null {
    return tickets.find((t) => t.eventId === eventId) ?? null
  },
}
