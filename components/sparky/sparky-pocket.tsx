"use client"

import { Sparkles } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { SPARKY_COPY } from "@/lib/sparky-copy"
import type { SparkyContextAction } from "@/lib/sparky-context-actions"
import type { SparkyCharacterMood } from "@/lib/sparky-mood"
import { moodLabel } from "@/lib/sparky-mood"

type Props = {
  open: boolean
  onClose: () => void
  mood: SparkyCharacterMood
  bondLabel: string
  bondProgress: number
  actions: SparkyContextAction[]
  onAction: (id: string) => void
  onQuietMode: () => void
}

export function SparkyPocket({
  open,
  onClose,
  mood,
  bondLabel,
  bondProgress,
  actions,
  onAction,
  onQuietMode,
}: Props) {
  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="bottom" className="max-h-[85vh] rounded-t-2xl border-primary/20">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            La casita de Sparky
          </SheetTitle>
        </SheetHeader>

        <p className="text-sm text-muted-foreground">
          Mood: <span className="font-medium text-foreground">{moodLabel(mood)}</span>
        </p>

        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Spark Bond</span>
            <span className="font-semibold text-primary">{bondLabel}</span>
          </div>
          <Progress value={bondProgress * 100} className="h-2" />
        </div>

        <p className="mt-4 text-xs text-muted-foreground">{SPARKY_COPY.pocketSubtitle}</p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          {actions.slice(0, 6).map((a) => (
            <Button key={a.id} variant="outline" size="sm" className="justify-start text-left" onClick={() => onAction(a.id)}>
              {a.label}
            </Button>
          ))}
        </div>

        <Button variant="ghost" size="sm" className="mt-4 w-full text-muted-foreground" onClick={onQuietMode}>
          Modo tranquilo
        </Button>
      </SheetContent>
    </Sheet>
  )
}
