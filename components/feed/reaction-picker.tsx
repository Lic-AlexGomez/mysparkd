"use client"

import { useState } from "react"
import { ReactionType } from "@/lib/types"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface ReactionPickerProps {
  onReact: (type: ReactionType) => void
  children: React.ReactNode
}

const reactions: { type: ReactionType; emoji: string; label: string }[] = [
  { type: 'LOVE', emoji: '❤️', label: 'Me encanta' },
  { type: 'HAHA', emoji: '😂', label: 'Jaja' },
  { type: 'WOW', emoji: '😮', label: 'Wow' },
  { type: 'SAD', emoji: '😢', label: 'Triste' },
  { type: 'ANGRY', emoji: '😡', label: 'Enojado' },
]

export function ReactionPicker({ onReact, children }: ReactionPickerProps) {
  const [open, setOpen] = useState(false)

  const handleReact = (type: ReactionType) => {
    onReact(type)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2 bg-card border-border" align="start">
        <div className="flex gap-1">
          {reactions.map((reaction) => (
            <button
              key={reaction.type}
              onClick={() => handleReact(reaction.type)}
              className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-muted transition-colors group"
              title={reaction.label}
            >
              <span className="text-2xl group-hover:scale-125 transition-transform">
                {reaction.emoji}
              </span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function getReactionEmoji(type: ReactionType): string {
  const reaction = reactions.find(r => r.type === type)
  return reaction?.emoji || '❤️'
}

export function getReactionLabel(type: ReactionType): string {
  const reaction = reactions.find(r => r.type === type)
  return reaction?.label || 'Me gusta'
}
