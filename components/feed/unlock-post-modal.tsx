"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Lock, Coins, RefreshCw, Loader2 } from "lucide-react"
import { api } from "@/lib/api"
import { toast } from "sonner"

interface UnlockPostModalProps {
  postId: string
  open: boolean
  onClose: () => void
  onUnlocked: () => void
}

export function UnlockPostModal({ postId, open, onClose, onUnlocked }: UnlockPostModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleUnlock = async (type: 'PAYMENT' | 'EXCHANGE') => {
    setIsLoading(true)
    try {
      await api.post(`/api/posts/${postId}/unlock`, { type })
      toast.success(type === 'PAYMENT' ? 'Post desbloqueado permanentemente' : 'Post desbloqueado por 24h')
      onUnlocked()
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al desbloquear')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            Desbloquear Contenido Premium
          </DialogTitle>
          <DialogDescription>
            Elige cómo desbloquear este post
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <Button
            onClick={() => handleUnlock('PAYMENT')}
            disabled={isLoading}
            className="w-full justify-start h-auto py-4 px-4"
            variant="outline"
          >
            <div className="flex items-start gap-3 w-full">
              <Coins className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="flex-1 text-left">
                <p className="font-semibold text-foreground">Pagar $0.99</p>
                <p className="text-xs text-muted-foreground">Desbloqueo permanente</p>
              </div>
            </div>
          </Button>

          <Button
            onClick={() => handleUnlock('EXCHANGE')}
            disabled={isLoading}
            className="w-full justify-start h-auto py-4 px-4"
            variant="outline"
          >
            <div className="flex items-start gap-3 w-full">
              <RefreshCw className="h-5 w-5 text-secondary shrink-0 mt-0.5" />
              <div className="flex-1 text-left">
                <p className="font-semibold text-foreground">Intercambiar</p>
                <p className="text-xs text-muted-foreground">Comparte tu post premium por 24h de acceso</p>
              </div>
            </div>
          </Button>

          {isLoading && (
            <div className="flex items-center justify-center py-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
