"use client"

import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { MessageCircle, Zap } from "lucide-react"

interface MatchModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  matchedUserId?: string
  matchedUserName?: string
}

export function MatchModal({
  open,
  onOpenChange,
  matchedUserId,
  matchedUserName,
}: MatchModalProps) {
  const router = useRouter()

  const handleChat = async () => {
    if (matchedUserId) {
      onOpenChange(false)
      router.push(`/chat`)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-sm text-center">
        <div className="flex flex-col items-center gap-6 py-6">
          {/* Sparkle animation */}
          <div className="relative">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary">
              <Zap className="h-12 w-12 text-white" />
            </div>
            {/* CSS sparkles */}
            <div className="absolute -top-2 -left-2 h-4 w-4 animate-ping rounded-full bg-accent" />
            <div className="absolute -top-1 -right-3 h-3 w-3 animate-ping rounded-full bg-secondary delay-100" />
            <div className="absolute -bottom-2 -left-3 h-3 w-3 animate-ping rounded-full bg-primary delay-200" />
          </div>

          <div>
            <h2 className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-3xl font-black text-transparent">
              It{"'"}s a Match!
            </h2>
            {matchedUserName && (
              <p className="mt-2 text-muted-foreground">
                Tu y{" "}
                <span className="font-semibold text-foreground">
                  {matchedUserName}
                </span>{" "}
                se gustan
              </p>
            )}
          </div>

          <div className="flex w-full flex-col gap-2">
            <Button
              onClick={handleChat}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Enviar mensaje
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-border text-foreground hover:bg-muted"
            >
              Seguir deslizando
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
