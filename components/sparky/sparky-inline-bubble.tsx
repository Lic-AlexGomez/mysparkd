"use client"

import { useEffect } from "react"
import { Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type SparkyInlineBubbleAction = {
  label: string
  onPress: () => void
  variant?: "primary" | "secondary"
}

type Props = {
  visible: boolean
  message: string
  loading?: boolean
  hint?: string
  actions?: SparkyInlineBubbleAction[]
  className?: string
  onClose: () => void
  onMore?: () => void
  autoDismissMs?: number
}

export function SparkyInlineBubble({
  visible,
  message,
  loading = false,
  hint,
  actions = [],
  className,
  onClose,
  onMore,
  autoDismissMs = 9000,
}: Props) {
  useEffect(() => {
    if (!visible || loading || autoDismissMs <= 0) return
    const t = setTimeout(onClose, autoDismissMs)
    return () => clearTimeout(t)
  }, [visible, loading, autoDismissMs, onClose])

  if (!visible) return null

  return (
    <div
      className={cn(
        "pointer-events-auto z-[8998] max-w-[280px] rounded-xl border border-primary/30 bg-card p-3 shadow-lg shadow-primary/10",
        className
      )}
    >
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-foreground">Sparky</span>
        <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground" aria-label="Cerrar">
          <X className="h-4 w-4" />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span>{message}</span>
        </div>
      ) : (
        <p className="text-sm font-medium leading-snug text-foreground">{message}</p>
      )}

      {!loading && actions.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {actions.slice(0, 2).map((a) => (
            <Button
              key={a.label}
              size="sm"
              variant={a.variant === "primary" ? "default" : "outline"}
              className="h-8 rounded-full text-xs"
              onClick={a.onPress}
            >
              {a.label}
            </Button>
          ))}
        </div>
      ) : null}

      {hint ? <p className="mt-2 text-[10px] italic text-muted-foreground">{hint}</p> : null}

      {onMore && !loading ? (
        <button type="button" onClick={onMore} className="mt-2 text-xs font-semibold text-primary hover:underline">
          Más opciones
        </button>
      ) : null}
    </div>
  )
}
