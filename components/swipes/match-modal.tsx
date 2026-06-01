"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { MessageCircle, Zap, Loader2 } from "lucide-react"
import { chatService } from "@/lib/services/chat"
import {
  DmEligibilityBlockedError,
  eligibilityMessageKey,
  ensureCanOpenDm,
} from "@/lib/dm-eligibility"
import { toast } from "sonner"
import { useI18n } from "@/lib/i18n"

interface MatchModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  matchedUserId?: string
  matchedUserName?: string
}

export function MatchModal({ open, onOpenChange, matchedUserId, matchedUserName }: MatchModalProps) {
  const router = useRouter()
  const { t } = useI18n()
  const [isLoading, setIsLoading] = useState(false)

  const handleChat = async () => {
    if (!matchedUserId) return
    setIsLoading(true)
    try {
      await ensureCanOpenDm(matchedUserId, "DATING")
      const chat = await chatService.openChat(matchedUserId, { context: "DATING" })
      onOpenChange(false)
      router.push(`/chat/${encodeURIComponent(chat.chatId)}`)
    } catch (err) {
      if (err instanceof DmEligibilityBlockedError) {
        const key = eligibilityMessageKey(err.eligibility.reason)
        toast.error(key ? t(key) : t("match.openChatError"))
        return
      }
      toast.error(t("match.openChatError"))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-sm text-center">
        <div className="flex flex-col items-center gap-6 py-6">
          <div className="relative">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary">
              <Zap className="h-12 w-12 text-white" />
            </div>
            <div className="absolute -top-2 -left-2 h-4 w-4 animate-ping rounded-full bg-accent" />
            <div className="absolute -top-1 -right-3 h-3 w-3 animate-ping rounded-full bg-secondary delay-100" />
            <div className="absolute -bottom-2 -left-3 h-3 w-3 animate-ping rounded-full bg-primary delay-200" />
          </div>

          <div>
            <h2 className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-3xl font-black text-transparent">
              {t("match.title")}
            </h2>
            {matchedUserName && (
              <p className="mt-2 text-muted-foreground">
                {t("match.youAndLike").replace("{name}", matchedUserName)}
              </p>
            )}
          </div>

          <div className="flex w-full flex-col gap-2">
            <Button
              onClick={handleChat}
              disabled={isLoading}
              className="bg-gradient-to-r from-primary to-secondary text-black font-semibold"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <MessageCircle className="mr-2 h-4 w-4" />
              )}
              {t("match.sendMessage")}
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-border text-foreground hover:bg-muted"
            >
              {t("match.keepSwiping")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
