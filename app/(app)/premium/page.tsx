"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/auth-context"
import { api, ApiError, rateLimitHint } from "@/lib/api"
import type { UserSubscription } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Crown, Check, Loader2, Zap, Eye, Lock, MessageCircle } from "lucide-react"
import { toast } from "sonner"
import { usePremiumStatus } from "@/hooks/use-premium-status"
import { useI18n } from "@/lib/i18n"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function PremiumPage() {
  const { te, t, language } = useI18n()
  const { refreshProfile } = useAuth()
  const { isPremium, refresh: refreshPremiumFlag } = usePremiumStatus()
  const [isLoading, setIsLoading] = useState(false)
  const [subscription, setSubscription] = useState<UserSubscription | null>(null)
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [cancelSubmitting, setCancelSubmitting] = useState(false)

  const featureDetails: Record<string, { title: string; description: string }> = {
    swipes: {
      title: te("Swipes ilimitados", "Unlimited swipes"),
      description: te(
        "Desliza sin límites. Con Premium, puedes dar like a tantos perfiles como quieras sin restricciones diarias. Aumenta tus posibilidades de encontrar conexiones perfectas.",
        "Swipe without limits. With Premium, you can like as many profiles as you want with no daily cap. Increase your chances of finding great connections.",
      ),
    },
    likes: {
      title: te("Ve quien te dio like", "See who liked you"),
      description: te(
        "Descubre quién está interesado en ti antes de hacer match. Ahorra tiempo y conecta directamente con las personas que ya mostraron interés en tu perfil.",
        "See who is interested in you before matching. Save time and connect directly with people who already liked your profile.",
      ),
    },
    content: {
      title: te("Contenido premium", "Premium content"),
      description: te(
        "Accede a posts exclusivos bloqueados para usuarios gratuitos. Desbloquea contenido especial y disfruta de una experiencia completa sin restricciones.",
        "Access exclusive posts locked for free users. Unlock special content and enjoy the full experience without restrictions.",
      ),
    },
    priority: {
      title: te("Prioridad en chat", "Chat priority"),
      description: te(
        "Tus mensajes aparecen primero. Los usuarios premium tienen prioridad en las conversaciones, aumentando las probabilidades de respuesta rápida.",
        "Your messages appear first. Premium users have priority in conversations, increasing the chances of a fast reply.",
      ),
    },
  }

  const fetchSubscription = useCallback(async () => {
    try {
      const data = await api.get<UserSubscription>("/api/user-subscription/status")
      setSubscription(data)
    } catch (error) {
      console.error(te("Error al obtener suscripción:", "Error loading subscription:"), error)
    }
  }, [te])

  useEffect(() => {
    if (isPremium) {
      void fetchSubscription()
    }
  }, [isPremium, fetchSubscription])

  const handleSubscribe = async () => {
    setIsLoading(true)
    try {
      const url = await api.post<string>("/api/subscription/checkout")
      if (url && typeof url === "string") {
        window.location.href = url
      } else {
        toast.error(te("No se pudo obtener el enlace de pago", "Could not get checkout link"))
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        toast.error(rateLimitHint(err))
      } else {
        toast.error(
          err instanceof Error ? err.message : te("Error al procesar suscripción", "Error processing subscription"),
        )
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirmCancel = async () => {
    setCancelSubmitting(true)
    try {
      const dto = await api.post<UserSubscription>("/api/subscription/cancel")
      setSubscription(dto)
      await refreshProfile()
      await refreshPremiumFlag()
      const msg =
        dto.message?.trim() ||
        te(
          "Suscripción cancelada: mantendrás Premium hasta el fin del periodo pagado.",
          "Subscription canceled: you keep Premium until the end of the paid period.",
        )
      toast.success(msg)
      setCancelDialogOpen(false)
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        toast.error(rateLimitHint(err))
      } else {
        toast.error(
          err instanceof Error ? err.message : te("No se pudo cancelar la suscripción", "Could not cancel subscription"),
        )
      }
    } finally {
      setCancelSubmitting(false)
    }
  }

  const renewalLabel =
    subscription?.currentPeriodEnd &&
    new Date(subscription.currentPeriodEnd).toLocaleDateString(language === "es" ? "es" : "en", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <Crown className="h-12 w-12 mx-auto mb-4 text-primary" />
        <h1 className="text-3xl font-bold mb-2">{te("Sparkd Premium", "Sparkd Premium")}</h1>
        <p className="text-muted-foreground">{te("Desbloquea todas las funciones", "Unlock all features")}</p>
      </div>

      {/* Active Subscription */}
      {isPremium && subscription && (
        <div className="mb-12 p-6 rounded-2xl border-2 border-green-500/20 bg-green-500/5">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-green-500">
                <Crown className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold">{te("Premium Activo", "Premium Active")}</h2>
                <p className="text-sm text-muted-foreground">$9.99/{te("mes", "month")}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-green-500 text-white">{te("Activo", "Active")}</Badge>
              {subscription.cancelAtPeriodEnd && (
                <Badge variant="outline" className="border-amber-500/60 text-amber-700 dark:text-amber-300">
                  {te("Cancelación programada", "Cancellation scheduled")}
                </Badge>
              )}
            </div>
          </div>

          {subscription.cancelAtPeriodEnd && renewalLabel && (
            <p className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-100">
              {te(
                "Tu suscripción no se renovará. Sigues teniendo Premium hasta el",
                "Your subscription will not renew. You keep Premium until",
              )}{" "}
              <span className="font-semibold">{renewalLabel}</span>.
            </p>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {subscription.currentPeriodEnd && !subscription.cancelAtPeriodEnd && (
              <p className="text-sm text-muted-foreground">
                {te("Próxima renovación", "Next renewal")}:{" "}
                <span className="font-medium text-foreground">{renewalLabel}</span>
              </p>
            )}
            {!subscription.cancelAtPeriodEnd && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCancelDialogOpen(true)}
                className="text-red-500 hover:text-red-600 hover:bg-red-500/10 sm:ml-auto"
              >
                {te("Cancelar suscripción", "Cancel subscription")}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Features */}
      <div className="grid sm:grid-cols-2 gap-4 mb-12">
        {[
          { icon: Zap, text: te("Swipes ilimitados", "Unlimited swipes"), key: "swipes" },
          { icon: Eye, text: te("Ve quien te dio like", "See who liked you"), key: "likes" },
          { icon: Lock, text: te("Contenido premium", "Premium content"), key: "content" },
          { icon: MessageCircle, text: te("Prioridad en chat", "Chat priority"), key: "priority" },
        ].map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setSelectedFeature(item.key)}
            className="flex items-center gap-3 p-4 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-all cursor-pointer text-left"
          >
            <item.icon className="h-5 w-5 text-primary" />
            <span className="font-medium">{item.text}</span>
          </button>
        ))}
      </div>

      {/* Feature Detail Modal */}
      <Dialog open={!!selectedFeature} onOpenChange={() => setSelectedFeature(null)}>
        <DialogContent className="sm:max-w-md">
          {selectedFeature && featureDetails[selectedFeature] && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedFeature === "swipes" && <Zap className="h-5 w-5 text-primary" />}
                  {selectedFeature === "likes" && <Eye className="h-5 w-5 text-primary" />}
                  {selectedFeature === "content" && <Lock className="h-5 w-5 text-primary" />}
                  {selectedFeature === "priority" && <MessageCircle className="h-5 w-5 text-primary" />}
                  {featureDetails[selectedFeature].title}
                </DialogTitle>
                <DialogDescription className="text-base pt-2">
                  {featureDetails[selectedFeature].description}
                </DialogDescription>
              </DialogHeader>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={cancelDialogOpen} onOpenChange={(o) => !cancelSubmitting && setCancelDialogOpen(o)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{te("¿Cancelar Premium?", "Cancel Premium?")}</DialogTitle>
            <DialogDescription className="space-y-2 text-sm leading-relaxed">
              <p>
                {te(
                  "Dejarás de renovar automáticamente. Seguirás teniendo acceso Premium hasta la fecha de fin del periodo actual (según Stripe / tu cuenta).",
                  "Auto-renew will stop. You keep Premium access until the end of your current billing period.",
                )}
              </p>
              {renewalLabel && (
                <p className="font-medium text-foreground">
                  {te("Fin del periodo actual (referencia)", "Current period ends (reference)")}: {renewalLabel}
                </p>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" disabled={cancelSubmitting} onClick={() => setCancelDialogOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={cancelSubmitting}
              onClick={() => void handleConfirmCancel()}
            >
              {cancelSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                  {te("Cancelando…", "Canceling…")}
                </>
              ) : (
                te("Confirmar cancelación", "Confirm cancellation")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pricing */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Free */}
        <div className="p-6 rounded-2xl border border-border">
          <h3 className="text-xl font-bold mb-1">{te("Gratis", "Free")}</h3>
          <div className="text-3xl font-bold mb-6">
            $0<span className="text-lg text-muted-foreground">/{te("mes", "month")}</span>
          </div>
          <ul className="space-y-3 mb-6">
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" /> {te("Swipes limitados", "Limited swipes")}
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" /> {te("Ver feed", "View feed")}
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" /> {te("Chat básico", "Basic chat")}
            </li>
          </ul>
          {!isPremium && <Badge variant="outline">{te("Plan actual", "Current plan")}</Badge>}
        </div>

        {/* Premium */}
        <div className="p-6 rounded-2xl border-2 border-primary bg-primary/5 relative">
          <Badge className="absolute -top-3 right-4 bg-primary text-white">{te("Recomendado", "Recommended")}</Badge>
          <h3 className="text-xl font-bold mb-1 flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            {te("Premium", "Premium")}
          </h3>
          <div className="text-3xl font-bold mb-6">
            $9.99<span className="text-lg text-muted-foreground">/{te("mes", "month")}</span>
          </div>
          <ul className="space-y-3 mb-6">
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" /> {te("Swipes ilimitados", "Unlimited swipes")}
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" /> {te("Ver quien te gusta", "See who likes you")}
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" /> {te("Contenido exclusivo", "Exclusive content")}
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" /> {te("Boost de perfil", "Profile boost")}
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" /> {te("Sin anuncios", "No ads")}
            </li>
          </ul>
          <Button
            onClick={handleSubscribe}
            disabled={isLoading || isPremium}
            className="w-full bg-primary hover:bg-primary/90"
          >
            {isPremium ? (
              te("Ya eres Premium", "You are already Premium")
            ) : isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              te("Activar Premium", "Activate Premium")
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
