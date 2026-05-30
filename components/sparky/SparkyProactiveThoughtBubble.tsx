"use client"

import { motion } from "framer-motion"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

type SparkyProactiveThoughtBubbleProps = {
  message: string
  onDismiss: () => void
  tailSide?: "left" | "right"
  className?: string
}

export function SparkyProactiveThoughtBubble({
  message,
  onDismiss,
  tailSide = "right",
  className,
}: SparkyProactiveThoughtBubbleProps) {
  return (
    <motion.div
      role="status"
      aria-live="polite"
      className={cn("fixed z-[59] flex max-w-[min(240px,calc(100vw-2.5rem))] flex-col items-center", className)}
      initial={{ opacity: 0, y: 10, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
    >
      <div className="relative w-full rounded-[22px] border border-white/12 bg-card/90 px-3.5 py-3 shadow-xl shadow-black/25 backdrop-blur-xl">
        <p className="pr-6 text-sm font-semibold leading-snug text-foreground">{message}</p>
        <button
          type="button"
          onClick={onDismiss}
          title="Cerrar"
          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition hover:bg-white/10 hover:text-foreground"
          aria-label="Cerrar pensamiento"
        >
          <X className="h-3.5 w-3.5" />
        </button>
        <span className="mt-1 block text-[10px] font-semibold text-rose-200/80">Sparky</span>
      </div>
      <div
        className={cn(
          "relative -mt-px flex h-3 w-full",
          tailSide === "left" ? "justify-start pl-8" : "justify-end pr-8"
        )}
        aria-hidden
      >
        <div className="h-0 w-0 border-x-[9px] border-t-[11px] border-x-transparent border-t-card/90" />
      </div>
    </motion.div>
  )
}
