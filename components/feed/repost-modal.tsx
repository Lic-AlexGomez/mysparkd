"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Repeat2 } from "lucide-react"

interface RepostModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onRepost: (comment: string) => void
}

export function RepostModal({ open, onOpenChange, onRepost }: RepostModalProps) {
  const [comment, setComment] = useState("")
  const minChars = 20

  const handleRepost = () => {
    if (comment.trim().length >= minChars) {
      onRepost(comment.trim())
      setComment("")
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <Repeat2 className="h-5 w-5 text-primary" />
            Repostear con comentario
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Agrega un comentario (mínimo 20 caracteres)..."
            className="bg-muted border-border text-foreground min-h-[100px]"
          />
          <div className="flex items-center justify-between">
            <span className={`text-xs ${comment.length >= minChars ? 'text-success' : 'text-muted-foreground'}`}>
              {comment.length}/{minChars}
            </span>
            <Button
              onClick={handleRepost}
              disabled={comment.trim().length < minChars}
              className="bg-primary text-primary-foreground"
            >
              Repostear
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
