"use client"

import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Lock, Crown, RefreshCw, Loader2, Upload } from "lucide-react"
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [postBody, setPostBody] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const { isPremium } = usePremiumStatus()

  const handleGetPremium = () => {
    onClose()
    router.push('/premium')
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setSelectedFile(file)
  }

  const handleUnlock = async () => {
    if (!selectedFile) {
      toast.error('Debes subir una imagen o video para desbloquear')
      return
    }
    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append('post', JSON.stringify({ body: postBody.trim() || 'Intercambio de contenido' }))
      formData.append('file', selectedFile)

      await api.post(`/api/posts/${postId}/unlock`, formData)
      toast.success('Post desbloqueado exitosamente')
      onUnlocked()
      onClose()
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Error al desbloquear'
      toast.error(errorMessage)
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

          {/* Opción de intercambio con archivo */}
          <div className="flex flex-col gap-2">
            <div className="flex items-start gap-3 rounded-lg border border-border p-3">
              <RefreshCw className="h-5 w-5 text-secondary shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-foreground text-sm">Intercambiar</p>
                <p className="text-xs text-muted-foreground">Sube tu propio post premium para obtener acceso</p>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <textarea
              value={postBody}
              onChange={(e) => setPostBody(e.target.value)}
              placeholder="Escribe algo sobre tu post de intercambio..."
              maxLength={300}
              rows={3}
              className="w-full p-2 text-sm bg-muted border border-border rounded-lg text-foreground resize-none placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <span className="text-xs text-muted-foreground text-right">{postBody.length}/300</span>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
            >
              <Upload className="h-4 w-4 mr-2" />
              {selectedFile ? selectedFile.name : 'Seleccionar imagen o video'}
            </Button>

            <Button
              onClick={handleUnlock}
              disabled={isLoading || !selectedFile}
              className="w-full"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Desbloquear
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
