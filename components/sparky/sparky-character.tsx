"use client"

import { cn } from "@/lib/utils"
import type { SparkyExpression } from "@/components/sparky/sparky-types"

const EMOJI: Record<SparkyExpression, string> = {
  idle: "✨",
  happy: "😊",
  excited: "⚡",
  thinking: "🤔",
  wink: "😉",
  speaking: "💬",
  celebrating: "🎉",
  sleepy: "😴",
}

type Props = {
  expression?: SparkyExpression
  size?: number
  className?: string
  pulse?: boolean
}

export function SparkyCharacter({ expression = "idle", size = 56, className, pulse }: Props) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center rounded-full border-2 border-primary/40 bg-card shadow-[0_0_24px_rgba(0,229,255,0.25)]",
        pulse && "animate-pulse",
        className
      )}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <span className="text-2xl select-none" style={{ fontSize: size * 0.45 }}>
        {EMOJI[expression]}
      </span>
      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[10px] font-bold text-primary">
        Sparky
      </span>
    </div>
  )
}
