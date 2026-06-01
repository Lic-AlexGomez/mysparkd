"use client"

import Link from "next/link"
import { Flame } from "lucide-react"
import type { EventGroupJoinRequest } from "@/lib/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

type Props = {
  invites: EventGroupJoinRequest[]
  onAccept: (requestId: string) => void
  onReject: (requestId: string) => void
  respondingId?: string | null
  onNavigate?: () => void
  te: (es: string, en: string) => string
}

export function EventInviteRows({
  invites,
  onAccept,
  onReject,
  respondingId,
  onNavigate,
  te,
}: Props) {
  if (!invites.length) return null

  return (
    <section className="border-b border-border bg-orange-500/5">
      <p className="px-3 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
        <Flame className="h-3.5 w-3.5 text-orange-500" aria-hidden />
        {te("Invitaciones a eventos", "Event invitations")} ({invites.length})
      </p>
      {invites.map((invite) => {
        const busy = respondingId === invite.id
        return (
          <div key={invite.id} className="px-3 py-3 border-t border-border/50 first:border-t-0">
            <div className="flex items-start gap-3">
              <Link
                href={`/events/${invite.eventId}`}
                onClick={onNavigate}
                className="shrink-0"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={invite.inviterProfilePictureUrl ?? undefined} />
                  <AvatarFallback className="bg-orange-500/15 text-orange-600 text-xs">
                    {invite.inviterUsername?.[0]?.toUpperCase() ?? "E"}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <div className="flex-1 min-w-0">
                <Link
                  href={`/events/${invite.eventId}`}
                  onClick={onNavigate}
                  className="text-sm font-semibold text-foreground hover:underline line-clamp-2"
                >
                  {invite.eventTitle}
                </Link>
                <p className="text-xs text-muted-foreground mt-0.5">
                  @{invite.inviterUsername}{" "}
                  {te("te invitó al grupo del evento", "invited you to the event group")}
                </p>
                {invite.message ? (
                  <p className="text-xs italic text-muted-foreground mt-1 line-clamp-2">
                    &ldquo;{invite.message}&rdquo;
                  </p>
                ) : null}
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <Button
                className="flex-1 h-9"
                disabled={busy}
                onClick={() => onAccept(invite.id)}
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : te("Aceptar", "Accept")}
              </Button>
              <Button
                variant="outline"
                className="flex-1 h-9"
                disabled={busy}
                onClick={() => onReject(invite.id)}
              >
                {te("Rechazar", "Decline")}
              </Button>
            </div>
          </div>
        )
      })}
    </section>
  )
}
