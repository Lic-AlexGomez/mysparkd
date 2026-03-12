"use client"

import { useState, useEffect } from "react"
import { Bell, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { usePushNotifications } from "@/hooks/use-push-notifications"
import { useAuth } from "@/lib/auth-context"

export function NotificationBanner() {
  const { user } = useAuth()
  const { permission, requestPermission, isSupported } = usePushNotifications()
  const [isVisible, setIsVisible] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    // Mostrar el banner solo si:
    // 1. El usuario está autenticado
    // 2. Las notificaciones están soportadas
    // 3. El permiso no ha sido otorgado ni denegado
    // 4. No se ha cerrado el banner antes (guardado en localStorage)
    if (user && isSupported && permission === "default") {
      const dismissed = localStorage.getItem(`notification-banner-dismissed-${user.userId}`)
      if (!dismissed) {
        // Mostrar después de 2 segundos del login
        setTimeout(() => {
          setIsVisible(true)
          setTimeout(() => setIsAnimating(true), 50)
        }, 2000)
      }
    }
  }, [user, isSupported, permission])

  const handleAllow = async () => {
    const granted = await requestPermission()
    if (granted) {
      handleClose()
    }
  }

  const handleClose = () => {
    setIsAnimating(false)
    setTimeout(() => {
      setIsVisible(false)
      if (user?.userId) {
        localStorage.setItem(`notification-banner-dismissed-${user.userId}`, 'true')
      }
    }, 300)
  }

  if (!isVisible) return null

  return (
    <div
      className={`fixed top-4 right-4 z-50 w-96 max-w-[calc(100vw-2rem)] transition-all duration-300 ${
        isAnimating ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 backdrop-blur-xl border border-primary/30 rounded-2xl shadow-2xl shadow-primary/20 p-5 relative overflow-hidden">
        {/* Efecto de brillo */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-pulse" />
        
        {/* Contenido */}
        <div className="relative z-10">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/30">
              <Bell className="w-6 h-6 text-primary-foreground" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-foreground mb-1">
                ¡Activa las notificaciones!
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Recibe alertas de nuevos matches, mensajes y reacciones en tiempo real
              </p>
              
              <div className="flex gap-2">
                <Button
                  onClick={handleAllow}
                  size="sm"
                  className="bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:opacity-90 transition-all hover:scale-105 shadow-lg shadow-primary/30"
                >
                  Activar
                </Button>
                <Button
                  onClick={handleClose}
                  size="sm"
                  variant="ghost"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Ahora no
                </Button>
              </div>
            </div>
            
            <button
              onClick={handleClose}
              className="flex-shrink-0 w-6 h-6 rounded-full hover:bg-muted transition-colors flex items-center justify-center text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
