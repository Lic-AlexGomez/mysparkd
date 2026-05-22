"use client"

import { useCallback, useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, Rocket, Zap } from "lucide-react"
import { toast } from "sonner"
import { ApiError, rateLimitHint } from "@/lib/api"
import {
  formatBoostPriceUsd,
  getPostBoostInfo,
  startPostBoostCheckout,
} from "@/lib/services/post-boost"
import type { PostBoostInfo } from "@/lib/types"
import { useI18n } from "@/lib/i18n"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  postId: string
  onBoostStarted?: () => void
}

export function PostBoostDialog({ open, onOpenChange, postId, onBoostStarted }: Props) {
  const { te } = useI18n()
  const [info, setInfo] = useState<PostBoostInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!postId) return
    setLoading(true)
    setError(null)
    try {
      setInfo(await getPostBoostInfo(postId))
    } catch (e) {
      setInfo(null)
      setError(e instanceof Error ? e.message : te("No se pudo cargar la información", "Could not load info"))
    } finally {
      setLoading(false)
    }
  }, [postId, te])

  useEffect(() => {
    if (open) void load()
  }, [open, load])

  const handleCheckout = async () => {
    if (!info?.permanent) return
    setPaying(true)
    try {
      const url = await startPostBoostCheckout(postId)
      if (url?.startsWith("http")) {
        onBoostStarted?.()
        window.location.href = url
      } else {
        toast.error(te("No se pudo obtener el enlace de pago", "Could not get checkout link"))
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        toast.error(rateLimitHint(err))
      } else {
        toast.error(
          err instanceof Error ? err.message : te("No se pudo iniciar el pago", "Could not start payment"),
        )
      }
    } finally {
      setPaying(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <Rocket className="h-5 w-5 text-secondary" />
            {te("Boost del post", "Post boost")}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {te("Más visibilidad en los feeds", "More visibility in feeds")}
          </p>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-6">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" className="mt-4" onClick={() => void load()}>
              {te("Reintentar", "Retry")}
            </Button>
          </div>
        ) : info ? (
          <div className="space-y-4">
            {!info.permanent ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-foreground">
                {te(
                  "Solo los posts permanentes pueden recibir boost. Edita el post y actívalo como permanente.",
                  "Only permanent posts can be boosted. Edit the post and enable permanent.",
                )}
              </div>
            ) : (
              <>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{te("En el feed", "In feed")}</span>
                    <span
                      className={
                        info.feedActive ? "font-semibold text-green-500" : "font-semibold text-destructive"
                      }
                    >
                      {info.feedActive ? te("Activo", "Active") : te("Inactivo", "Inactive")}
                    </span>
                  </div>
                  {info.timeUntilExpiry ? (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {te("Tiempo restante", "Time remaining")}
                      </span>
                      <span className="font-semibold text-foreground">{info.timeUntilExpiry}</span>
                    </div>
                  ) : null}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{te("Boosts realizados", "Boosts used")}</span>
                    <span className="font-semibold text-foreground">{info.boostCount}</span>
                  </div>
                </div>

                <div className="flex gap-3 rounded-lg border border-border bg-muted/50 p-4">
                  <Zap className="h-5 w-5 shrink-0 text-secondary" />
                  <div>
                    <p className="text-xs text-muted-foreground">{te("Próximo boost", "Next boost")}</p>
                    <p className="text-2xl font-bold text-foreground">{formatBoostPriceUsd(info)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {te(
                        "Cada boost duplica el precio. Tu post permanece 7 días más en los feeds.",
                        "Each boost doubles the price. Your post stays in feeds for 7 more days.",
                      )}
                    </p>
                  </div>
                </div>

                <Button
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={paying}
                  onClick={handleCheckout}
                >
                  {paying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {te("Redirigiendo...", "Redirecting...")}
                    </>
                  ) : (
                    te(`Boost por ${formatBoostPriceUsd(info)}`, `Boost for ${formatBoostPriceUsd(info)}`)
                  )}
                </Button>
              </>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
