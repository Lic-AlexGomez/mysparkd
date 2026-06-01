"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { eventPaymentService, type EventTicket } from "@/lib/services/event-payment"
import { useI18n } from "@/lib/i18n"
import { CheckCircle2, Loader2, Ticket } from "lucide-react"

export default function TicketSuccessPage() {
  const { te, language } = useI18n()
  const params = useParams()
  const eventId = String(params.eventId || "")
  const [ticket, setTicket] = useState<EventTicket | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!eventId) return
    eventPaymentService
      .getMyTickets()
      .then((rows) => setTicket(eventPaymentService.findTicketForEvent(rows, eventId)))
      .finally(() => setLoading(false))
  }, [eventId])

  const when = ticket?.eventDate
    ? new Date(ticket.eventDate).toLocaleString(language === "en" ? "en-US" : "es", {
        weekday: "long",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 py-10 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15">
        <CheckCircle2 className="h-9 w-9 text-emerald-500" />
      </div>
      <h1 className="text-2xl font-black text-foreground">
        {te("¡Ticket confirmado!", "Ticket confirmed!")}
      </h1>
      {loading ? (
        <Loader2 className="mt-6 h-8 w-8 animate-spin text-primary" />
      ) : (
        <>
          <p className="mt-2 text-lg font-semibold text-foreground">
            {ticket?.eventTitle || te("Tu evento", "Your event")}
          </p>
          {when ? <p className="mt-1 text-sm text-muted-foreground">{when}</p> : null}
          {ticket?.eventZone ? (
            <p className="text-sm text-muted-foreground">{ticket.eventZone}</p>
          ) : null}
          {ticket ? (
            <Button asChild className="mt-8 w-full">
              <Link href={`/events/payment/tickets/${ticket.ticketId}`}>
                <Ticket className="mr-2 h-4 w-4" />
                {te("Ver mi ticket", "View my ticket")}
              </Link>
            </Button>
          ) : (
            <Button asChild variant="outline" className="mt-8">
              <Link href={`/events/${eventId}`}>{te("Volver al evento", "Back to event")}</Link>
            </Button>
          )}
        </>
      )}
    </div>
  )
}
