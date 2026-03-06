"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X, Plus } from "lucide-react"
import { toast } from "sonner"

interface CreatePollDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreatePoll: (question: string, options: string[], durationHours: number) => void
}

export function CreatePollDialog({ open, onOpenChange, onCreatePoll }: CreatePollDialogProps) {
  const [question, setQuestion] = useState("")
  const [options, setOptions] = useState(["", ""])
  const [durationHours, setDurationHours] = useState(24)

  const addOption = () => {
    if (options.length < 4) {
      setOptions([...options, ""])
    }
  }

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index))
    }
  }

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options]
    newOptions[index] = value
    setOptions(newOptions)
  }

  const handleCreate = () => {
    if (!question.trim()) {
      toast.error("Escribe una pregunta")
      return
    }

    const validOptions = options.filter(o => o.trim())
    if (validOptions.length < 2) {
      toast.error("Agrega al menos 2 opciones")
      return
    }

    onCreatePoll(question.trim(), validOptions, durationHours)
    setQuestion("")
    setOptions(["", ""])
    setDurationHours(24)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">Crear encuesta</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-foreground">Pregunta</Label>
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="¿Cuál es tu favorito?"
              className="bg-muted border-border text-foreground"
              maxLength={100}
            />
            <span className="text-xs text-muted-foreground">{question.length}/100</span>
          </div>

          <div>
            <Label className="text-foreground">Opciones</Label>
            <div className="space-y-2 mt-2">
              {options.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    placeholder={`Opción ${index + 1}`}
                    className="bg-muted border-border text-foreground"
                    maxLength={50}
                  />
                  {options.length > 2 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeOption(index)}
                      className="shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            
            {options.length < 4 && (
              <Button
                variant="outline"
                size="sm"
                onClick={addOption}
                className="mt-2 w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar opción
              </Button>
            )}
          </div>

          <div>
            <Label className="text-foreground">Duración (horas)</Label>
            <Input
              type="number"
              value={durationHours}
              onChange={(e) => setDurationHours(Math.max(1, Math.min(168, parseInt(e.target.value) || 24)))}
              min={1}
              max={168}
              className="bg-muted border-border text-foreground"
            />
            <span className="text-xs text-muted-foreground">Máximo 7 días (168 horas)</span>
          </div>

          <Button
            onClick={handleCreate}
            className="w-full bg-primary text-primary-foreground"
          >
            Crear encuesta
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
