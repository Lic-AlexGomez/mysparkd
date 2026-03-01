"use client"

import { useState } from "react"
import { api } from "@/lib/api"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { Loader2, Plus, ImageIcon, X } from "lucide-react"
import { uploadToCloudinary } from "@/lib/cloudinary"

interface CreatePostDialogProps {
  onCreated: () => void
}

export function CreatePostDialog({ onCreated }: CreatePostDialogProps) {
  const [open, setOpen] = useState(false)
  const [body, setBody] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState("")
  const [permanent, setPermanent] = useState(true)
  const [durationHours, setDurationHours] = useState(24)
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setFilePreview(URL.createObjectURL(selectedFile))
    toast.success('Imagen seleccionada')
  }

  const handleSubmit = async () => {
    if (!body.trim() || body.trim().length < 10) {
      toast.error("El contenido debe tener al menos 10 caracteres")
      return
    }
    setIsLoading(true)
    try {
      const formData = new FormData()
      
      const postData = {
        body: body.trim(),
        permanent,
        ...(!permanent && { durationHours: Math.min(durationHours, 24) })
      }
      
      formData.append('post', JSON.stringify(postData))
      
      if (file) {
        formData.append('file', file)
      }
      
      const token = localStorage.getItem('sparkd_token')
     
      const res = await fetch('/api/proxy/api/posts/new', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })
 
      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.detail || error.message || 'Error al crear post')
      }
      
      toast.success("Post creado!")
      setBody("")
      setFile(null)
      setFilePreview("")
      setPermanent(true)
      setOpen(false)
      onCreated()
    } catch (err) {
      console.error('Error:', err)
      toast.error(err instanceof Error ? err.message : "Error al crear post")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="icon"
          className="fixed bottom-24 right-6 z-30 h-16 w-16 rounded-2xl bg-gradient-to-br from-primary via-secondary to-primary text-black shadow-2xl shadow-primary/40 hover:scale-110 hover:rotate-90 transition-all duration-300 lg:bottom-8 lg:right-8 border-2 border-white/20"
        >
          <Plus className="h-7 w-7" />
          <span className="sr-only">Crear post</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">Nuevo post</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label className="text-foreground">Contenido</Label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Que estas pensando?"
              className="min-h-24 resize-none bg-muted border-border text-foreground placeholder:text-muted-foreground"
              maxLength={500}
            />
            <span className="text-xs text-muted-foreground text-right">
              {body.length}/500 {body.length < 10 && body.length > 0 && '(mínimo 10)'}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <Label className="text-foreground flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Imagen (opcional)
            </Label>
            {filePreview && (
              <div className="relative">
                <img src={filePreview} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
                <button
                  onClick={() => {
                    setFile(null)
                    setFilePreview("")
                  }}
                  className="absolute top-2 right-2 h-6 w-6 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/70"
                >
                  <X className="h-4 w-4 text-white" />
                </button>
              </div>
            )}
            <div className="flex gap-2">
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={isUploading}
                className="bg-muted border-border text-foreground"
              />
              {isUploading && <Loader2 className="h-5 w-5 animate-spin" />}
            </div>
            <p className="text-xs text-muted-foreground">Nota: Las imágenes requieren configuración de Cloudinary en el backend.</p>
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-foreground">Post permanente</Label>
            <Switch checked={permanent} onCheckedChange={setPermanent} />
          </div>
          {!permanent && (
            <div className="flex flex-col gap-2">
              <Label className="text-foreground">
                Duración (horas): {durationHours} (máx. 48)
              </Label>
              <Input
                type="number"
                value={durationHours}
                onChange={(e) =>
                  setDurationHours(Math.max(1, Math.min(48, parseInt(e.target.value) || 1)))
                }
                min={1}
                max={48}
                className="bg-muted border-border text-foreground"
              />
              <p className="text-xs text-muted-foreground">
                El post se eliminará automáticamente después de {durationHours} {durationHours === 1 ? 'hora' : 'horas'}
              </p>
            </div>
          )}
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !body.trim() || body.trim().length < 10}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Publicando...
              </>
            ) : (
              "Publicar"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
