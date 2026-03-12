"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Lock, Crown, RefreshCw, Loader2 } from "lucide-react"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { usePremiumStatus } from "@/hooks/use-premium-status"

interface UnlockPostModalProps {
  postId: string
  open: boolean
  onClose: () => void
  onUnlocked: () => void
}

export function UnlockPostModal({ postId, open, onClose, onUnlocked }: UnlockPostModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { isPremium } = usePremiumStatus()

  const handleGetPremium = () => {
    onClose()
    router.push('/premium')
  }

  const handleUnlock = async (type: 'PAYMENT' | 'EXCHANGE') => {
    console.log('Intentando desbloquear post:', postId, 'con tipo:', type)
    setIsLoading(true)
    try {
      // Intentar desbloquear el post
      const response = await api.post(`/api/posts/${postId}/unlock`, { type })
      console.log('Respuesta del servidor:', response)
      toast.success(type === 'PAYMENT' ? 'Post desbloqueado permanentemente' : 'Post desbloqueado por 24h')
      onUnlocked()
      onClose()
    } catch (err: any) {
      console.error('Error al desbloquear:', err)
      // Si el endpoint no existe (404), mostrar mensaje alternativo
      if (err?.response?.status === 404) {
        toast.error('Función de desbloqueo no disponible', {
          description: 'Por favor, obtén una suscripción Premium para acceder a todo el contenido',
          action: {
            label: 'Ver Premium',
            onClick: handleGetPremium
          }
        })
      } else {
        const errorMessage = err?.response?.data?.message || err?.message || 'Error al desbloquear'
        toast.error(errorMessage)
      }
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
            Contenido Premium Bloqueado
          </DialogTitle>
          <DialogDescription>
            Obtén acceso a este contenido exclusivo
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          {/* Opción Premium (Recomendada) */}
          <div className="rounded-lg border-2 border-primary/50 bg-gradient-to-br from-primary/5 to-secondary/5 p-1">
            <Button
              onClick={handleGetPremium}
              disabled={isLoading}
              className="w-full justify-start h-auto py-4 px-4 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white border-0"
            >
              <div className="flex items-start gap-3 w-full">
                <Crown className="h-5 w-5 shrink-0 mt-0.5" />
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <p className="font-bold">Hazte Premium</p>
                    <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">Recomendado</span>
                  </div>
                  <p className="text-xs opacity-90 mt-1">Acceso ilimitado a todo el contenido premium</p>
                </div>
              </div>
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">O desbloquea solo este post</span>
            </div>
          </div>

          {/* Opción de intercambio */}
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
