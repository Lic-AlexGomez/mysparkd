"use client"

import { useState } from "react"
import { api } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Crown,
  Check,
  X,
  Loader2,
  Zap,
  Eye,
  MessageCircle,
  Lock,
} from "lucide-react"
import { toast } from "sonner"

const features = {
  free: [
    { label: "Swipes limitados por dia", included: true },
    { label: "Ver feed de posts", included: true },
    { label: "Chat con matches", included: true },
    { label: "Ver quien te dio like", included: false },
    { label: "Desbloquear contenido premium", included: false },
    { label: "Swipes ilimitados", included: false },
    { label: "Boost de perfil", included: false },
  ],
  premium: [
    { label: "Swipes ilimitados", included: true },
    { label: "Ver feed de posts", included: true },
    { label: "Chat con matches", included: true },
    { label: "Ver quien te dio like", included: true },
    { label: "Desbloquear contenido premium", included: true },
    { label: "Boost de perfil semanal", included: true },
    { label: "Sin anuncios", included: true },
  ],
}

export default function PremiumPage() {
  const [isLoading, setIsLoading] = useState(false)

  const handleSubscribe = async () => {
    setIsLoading(true)
    try {
      const url = await api.post<string>("/api/subscription/checkout")
      if (url && typeof url === "string") {
        window.location.href = url
      } else {
        toast.error("No se pudo obtener el enlace de pago")
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Error al procesar suscripcion"
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary">
          <Crown className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Sparkd Premium</h1>
        <p className="mt-2 text-muted-foreground">
          Desbloquea todo el potencial de Sparkd
        </p>
      </div>

      {/* Feature highlights */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Zap, label: "Swipes ilimitados", color: "text-accent" },
          { icon: Eye, label: "Ve quien te gusta", color: "text-primary" },
          {
            icon: Lock,
            label: "Contenido exclusivo",
            color: "text-secondary",
          },
          {
            icon: MessageCircle,
            label: "Prioridad en chat",
            color: "text-success",
          },
        ].map((item) => (
          <div
            key={item.label}
            className="flex flex-col items-center gap-2 rounded-xl bg-card p-4 border border-border"
          >
            <item.icon className={`h-6 w-6 ${item.color}`} />
            <span className="text-sm font-medium text-foreground text-center">
              {item.label}
            </span>
          </div>
        ))}
      </div>

      {/* Pricing cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Free plan */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-foreground">
              <span>Gratis</span>
              <Badge variant="secondary" className="bg-muted text-muted-foreground border-0">
                Plan actual
              </Badge>
            </CardTitle>
            <p className="text-2xl font-bold text-foreground">
              $0
              <span className="text-sm font-normal text-muted-foreground">
                /mes
              </span>
            </p>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-3">
              {features.free.map((f) => (
                <li key={f.label} className="flex items-center gap-2 text-sm">
                  {f.included ? (
                    <Check className="h-4 w-4 text-success shrink-0" />
                  ) : (
                    <X className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                  <span
                    className={
                      f.included ? "text-foreground" : "text-muted-foreground"
                    }
                  >
                    {f.label}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Premium plan */}
        <Card className="relative border-2 border-primary bg-card overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-secondary" />
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-foreground">
              <span className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-accent" />
                Premium
              </span>
              <Badge className="bg-primary text-primary-foreground border-0">
                Recomendado
              </Badge>
            </CardTitle>
            <p className="text-2xl font-bold text-foreground">
              $9.99
              <span className="text-sm font-normal text-muted-foreground">
                /mes
              </span>
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <ul className="flex flex-col gap-3">
              {features.premium.map((f) => (
                <li key={f.label} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-success shrink-0" />
                  <span className="text-foreground">{f.label}</span>
                </li>
              ))}
            </ul>
            <Button
              onClick={handleSubscribe}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <Crown className="mr-2 h-4 w-4" />
                  Suscribirme ahora
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
