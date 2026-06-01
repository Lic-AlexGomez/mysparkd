"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { eventPaymentService, type EventTicket } from "@/lib/services/event-payment"
import { useI18n } from "@/lib/i18n"
import { ArrowLeft, Loader2 } from "lucide-react"

export default function EventTicketPage() {
  const { te, language } = useI18n()
  const params = useParams()
  const ticketId = String(params.ticketId || "")
  const [ticket, setTicket] = useState<EventTicket | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!ticketId) return
    eventPaymentService
      .getTicket(ticketId)
      .then(async (t) => {
        setTicket(t)
        if (t?.ticketId) {
          const QRCode = (await import("qrcode")).default
          const url = await QRCode.toDataURL(t.ticketId, { margin: 2, width: 240 })
          setQrDataUrl(url)
        }
      })
      .finally(() => setLoading(false))
  }, [ticketId])

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="mx-auto max-w-md px-4 py-10 text-center">
        <p className="text-muted-foreground">{te("Ticket no encontrado", "Ticket not found")}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/profile">{te("Ir al perfil", "Go to profile")}</Link>
        </Button>
      </div>
    )
  }

  const when = ticket.eventDate
    ? new Date(ticket.eventDate).toLocaleString(language === "en" ? "en-US" : "es", {
        weekday: "long",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
        <Link href="/profile">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {te("Mis tickets", "My tickets")}
        </Link>
      </Button>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
        {ticket.eventCoverPhotoUrl ? (
          <div
            className="h-32 bg-cover bg-center"
            style={{ backgroundImage: `url(${ticket.eventCoverPhotoUrl})` }}
          />
        ) : (
          <div className="h-24 bg-gradient-to-br from-primary/30 to-secondary/20" />
        )}
        <div className="p-5">
          <div className="flex items-start justify-between gap-2">
            <h1 className="text-xl font-black text-foreground">{ticket.eventTitle}</h1>
            {ticket.used ? (
              <Badge variant="secondary">{te("Usado", "Used")}</Badge>
            ) : (
              <Badge className="bg-emerald-500/15 text-emerald-600">{te("Válido", "Valid")}</Badge>
            )}
          </div>
          {when ? <p className="mt-2 text-sm text-muted-foreground">{when}</p> : null}
          {ticket.eventZone ? (
            <p className="text-sm text-muted-foreground">{ticket.eventZone}</p>
          ) : null}
          {ticket.amountPaid != null ? (
            <p className="mt-2 text-sm font-semibold text-foreground">
              {te("Pagado", "Paid")}: ${Number(ticket.amountPaid).toFixed(2)}{" "}
              {(ticket.currency || "usd").toUpperCase()}
            </p>
          ) : null}

          {qrDataUrl ? (
            <div className="mt-6 flex flex-col items-center rounded-xl border border-dashed border-border bg-muted/30 p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrDataUrl} alt="QR ticket" className="h-60 w-60" />
              <p className="mt-2 break-all text-center text-[10px] text-muted-foreground">
                {ticket.ticketId}
              </p>
            </div>
          ) : null}

          {ticket.eventId ? (
            <Button asChild variant="outline" className="mt-4 w-full">
              <Link href={`/events/${ticket.eventId}`}>{te("Ver evento", "View event")}</Link>
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
