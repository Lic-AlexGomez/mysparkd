"use client"

import { motion } from "framer-motion"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

type SparkyProactiveThoughtBubbleProps = {
  message: string
  onDismiss: () => void
  /** FAB a la izquierda → cola apunta abajo-derecha hacia Sparky */
  tailSide?: "left" | "right"
  className?: string
}

/** Burbuja de pensamiento flotante — no caja de chat genérica. */
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
      className={cn("fixed z-[59] flex max-w-[min(220px,calc(100vw-2.5rem))] flex-col items-center", className)}
      initial={{ opacity: 0, y: 10, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
    >
      <div
        className={cn(
          "relative w-full rounded-[1.35rem] border border-primary/40 bg-gradient-to-br from-primary/12 via-card/95 to-card/90 px-3.5 py-2.5 shadow-lg shadow-primary/15 backdrop-blur-md",
          "before:pointer-events-none before:absolute before:inset-0 before:rounded-[1.35rem] before:ring-1 before:ring-white/10"
        )}
      >
        <p className="pr-6 text-sm font-semibold leading-snug tracking-tight text-foreground">{message}</p>
        <button
          type="button"
          onClick={onDismiss}
          className="absolute right-2 top-2 rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
          aria-label="Cerrar pensamiento"
        >
          <X className="h-3.5 w-3.5" />
        </button>
        <span className="mt-1 block text-[10px] font-medium uppercase tracking-wider text-primary/70">
          Sparky
        </span>
      </div>
      <div
        className={cn(
          "relative -mt-px flex h-3 w-full",
          tailSide === "left" ? "justify-start pl-6" : "justify-end pr-6"
        )}
        aria-hidden
      >
        <div className="h-0 w-0 border-x-[9px] border-t-[11px] border-x-transparent border-t-primary/35" />
        <div
          className={cn(
            "absolute top-0 h-2 w-2 rounded-full border border-primary/30 bg-card/90",
            tailSide === "left" ? "left-3" : "right-3"
          )}
        />
      </div>
    </motion.div>
  )
}
