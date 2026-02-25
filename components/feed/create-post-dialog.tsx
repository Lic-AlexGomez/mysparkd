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
import { Loader2, Plus, ImageIcon } from "lucide-react"

interface CreatePostDialogProps {
  onCreated: () => void
}

export function CreatePostDialog({ onCreated }: CreatePostDialogProps) {
  const [open, setOpen] = useState(false)
  const [body, setBody] = useState("")
  const [file, setFile] = useState("")
  const [permanent, setPermanent] = useState(true)
  const [durationHours, setDurationHours] = useState(24)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async () => {
    if (!body.trim()) {
      toast.error("Escribe algo en tu post")
      return
    }
    setIsLoading(true)
    try {
      await api.post("/api/posts/new", {
        body: body.trim(),
        file: file.trim() || undefined,
        permanent,
        durationHours: permanent ? undefined : durationHours,
      })
      toast.success("Post creado!")
      setBody("")
      setFile("")
      setPermanent(true)
      setOpen(false)
      onCreated()
    } catch (err) {
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
          className="fixed bottom-24 right-4 z-30 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 lg:bottom-8"
        >
          <Plus className="h-6 w-6" />
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
              {body.length}/500
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <Label className="text-foreground flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Imagen (URL)
            </Label>
            <Input
              value={file}
              onChange={(e) => setFile(e.target.value)}
              placeholder="https://ejemplo.com/imagen.jpg"
              className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-foreground">Post permanente</Label>
            <Switch checked={permanent} onCheckedChange={setPermanent} />
          </div>
          {!permanent && (
            <div className="flex flex-col gap-2">
              <Label className="text-foreground">
                Duracion (horas): {durationHours}
              </Label>
              <Input
                type="number"
                value={durationHours}
                onChange={(e) =>
                  setDurationHours(Math.max(1, parseInt(e.target.value) || 1))
                }
                min={1}
                max={168}
                className="bg-muted border-border text-foreground"
              />
            </div>
          )}
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !body.trim()}
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
