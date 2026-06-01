"use client"

import { useRouter } from "next/navigation"
import { Calendar, UserPlus, Sparkles, Users, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ChatContextResponse } from "@/lib/types/context-aware-chat"
import { contextAwareChatService } from "@/lib/services/context-aware-chat"
import { toast } from "sonner"

export function ChatContextActions({
  chatId,
  context,
  te,
}: {
  chatId: string
  context: ChatContextResponse | null
  te: (es: string, en: string) => string
}) {
  const router = useRouter()
  if (!context) return null

  const run = async (action: Parameters<typeof contextAwareChatService.postAction>[0]["action"]) => {
    try {
      const res = await contextAwareChatService.postAction({
        chat_id: chatId,
        action,
        context_id: context.context_id ?? undefined,
      })
      if (res.deeplink) router.push(res.deeplink)
    } catch {
      toast.error(te("No se pudo completar la acción", "Could not complete action"))
    }
  }

  const viewEvent =
    context.chat_type === "EVENT" && context.context_id
      ? (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="h-8 gap-1 text-xs"
            onClick={() => void run("view_event")}
          >
            <Calendar className="size-3.5 shrink-0" />
            {te("Ver evento", "View event")}
          </Button>
        )
      : null

  const joinPlan = (
    <Button
      type="button"
      size="sm"
      variant="outline"
      className="h-8 gap-1 text-xs border-primary/30"
      onClick={() => void run("join_plan")}
    >
      <Users className="size-3.5 shrink-0" />
      {te("Unir al plan", "Join plan")}
    </Button>
  )

  const invite = (
    <Button
      type="button"
      size="sm"
      variant="outline"
      className="h-8 gap-1 text-xs border-primary/30"
      onClick={() => void run("invite_friends")}
    >
      <UserPlus className="size-3.5 shrink-0" />
      {te("Invitar", "Invite friends")}
    </Button>
  )

  const meetup = (
    <Button
      type="button"
      size="sm"
      variant="outline"
      className="h-8 gap-1 text-xs border-primary/30"
      onClick={() => void run("convert_meetup")}
    >
      <Sparkles className="size-3.5 shrink-0" />
      {te("Meetup", "Meetup")}
    </Button>
  )

  const fd = (
    <Button
      type="button"
      size="sm"
      variant="outline"
      className="h-8 gap-1 text-xs border-primary/30"
      onClick={() => void run("start_fast_date")}
    >
      <Zap className="size-3.5 shrink-0" />
      {te("Fast Date", "Fast Date")}
    </Button>
  )

  return (
    <div className="flex flex-shrink-0 flex-wrap gap-1.5 border-b border-primary/15 bg-primary/[0.04] px-3 py-2">
      {viewEvent}
      {joinPlan}
      {invite}
      {meetup}
      {fd}
    </div>
  )
}
