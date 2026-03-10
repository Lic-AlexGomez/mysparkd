"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
import type { UserSubscription } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Crown, Check, Loader2, Zap, Eye, Lock, MessageCircle } from "lucide-react"
import { toast } from "sonner"
import { usePremiumStatus } from "@/hooks/use-premium-status"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function PremiumPage() {
  const { user } = useAuth()
  const { isPremium } = usePremiumStatus()
  const [isLoading, setIsLoading] = useState(false)
  const [subscription, setSubscription] = useState<UserSubscription | null>(null)
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null)

  const featureDetails: Record<string, { title: string; description: string }> = {
    swipes: {
      title: "Swipes ilimitados",
      description: "Desliza sin límites. Con Premium, puedes dar like a tantos perfiles como quieras sin restricciones diarias. Aumenta tus posibilidades de encontrar conexiones perfectas."
    },
    likes: {
      title: "Ve quien te dio like",
      description: "Descubre quién está interesado en ti antes de hacer match. Ahorra tiempo y conecta directamente con las personas que ya mostraron interés en tu perfil."
    },
    content: {
      title: "Contenido premium",
      description: "Accede a posts exclusivos bloqueados para usuarios gratuitos. Desbloquea contenido especial y disfruta de una experiencia completa sin restricciones."
    },
    priority: {
      title: "Prioridad en chat",
      description: "Tus mensajes aparecen primero. Los usuarios premium tienen prioridad en las conversaciones, aumentando las probabilidades de respuesta rápida."
    }
  }

  useEffect(() => {
    if (isPremium) {
      fetchSubscription()
    }
  }, [isPremium])

  const fetchSubscription = async () => {
    try {
      const data = await api.get<UserSubscription>("/api/user-subscription/status")
      setSubscription(data)
    } catch (error) {
      console.log('Error al obtener suscripción:', error)
    }
  }

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
      toast.error(err instanceof Error ? err.message : "Error al procesar suscripcion")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <Crown className="h-12 w-12 mx-auto mb-4 text-primary" />
        <h1 className="text-3xl font-bold mb-2">Sparkd Premium</h1>
        <p className="text-muted-foreground">Desbloquea todas las funciones</p>
      </div>

      {/* Active Subscription */}
      {isPremium && subscription && (
        <div className="mb-12 p-6 rounded-2xl border-2 border-green-500/20 bg-green-500/5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-green-500">
                <Crown className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Premium Activo</h2>
                <p className="text-sm text-muted-foreground">$9.99/mes</p>
              </div>
            </div>
            <Badge className="bg-green-500 text-white">Activo</Badge>
          </div>
          
          <div className="flex items-center justify-between">
            {subscription.currentPeriodEnd && (
              <p className="text-sm text-muted-foreground">
                Próxima renovación: <span className="font-medium text-foreground">{new Date(subscription.currentPeriodEnd).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </p>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toast.error("Próximamente: Cancelar suscripción")}
              className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Features */}
      <div className="grid sm:grid-cols-2 gap-4 mb-12">
        {[
          { icon: Zap, text: "Swipes ilimitados", key: "swipes" },
          { icon: Eye, text: "Ve quien te dio like", key: "likes" },
          { icon: Lock, text: "Contenido premium", key: "content" },
          { icon: MessageCircle, text: "Prioridad en chat", key: "priority" },
        ].map((item) => (
          <button
            key={item.key}
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
                  {selectedFeature === 'swipes' && <Zap className="h-5 w-5 text-primary" />}
                  {selectedFeature === 'likes' && <Eye className="h-5 w-5 text-primary" />}
                  {selectedFeature === 'content' && <Lock className="h-5 w-5 text-primary" />}
                  {selectedFeature === 'priority' && <MessageCircle className="h-5 w-5 text-primary" />}
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

      {/* Pricing */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Free */}
        <div className="p-6 rounded-2xl border border-border">
          <h3 className="text-xl font-bold mb-1">Gratis</h3>
          <div className="text-3xl font-bold mb-6">$0<span className="text-lg text-muted-foreground">/mes</span></div>
          <ul className="space-y-3 mb-6">
            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Swipes limitados</li>
            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Ver feed</li>
            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Chat básico</li>
          </ul>
          {!isPremium && <Badge variant="outline">Plan actual</Badge>}
        </div>

        {/* Premium */}
        <div className="p-6 rounded-2xl border-2 border-primary bg-primary/5 relative">
          <Badge className="absolute -top-3 right-4 bg-primary text-white">Recomendado</Badge>
          <h3 className="text-xl font-bold mb-1 flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            Premium
          </h3>
          <div className="text-3xl font-bold mb-6">$9.99<span className="text-lg text-muted-foreground">/mes</span></div>
          <ul className="space-y-3 mb-6">
            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Swipes ilimitados</li>
            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Ver quien te gusta</li>
            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Contenido exclusivo</li>
            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Boost de perfil</li>
            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Sin anuncios</li>
          </ul>
          <Button
            onClick={handleSubscribe}
            disabled={isLoading || isPremium}
            className="w-full bg-primary hover:bg-primary/90"
          >
            {isPremium ? "Ya eres Premium" : isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Activar Premium"}
          </Button>
        </div>
      </div>
    </div>
  )
}
