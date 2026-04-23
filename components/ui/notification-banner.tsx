"use client"

import { useState, useEffect } from "react"
import { Bell, X } from "lucide-react"
import { usePushNotifications } from "@/hooks/use-push-notifications"
import { useAuth } from "@/lib/auth-context"

export function NotificationBanner() {
  const { user } = useAuth()
  const { requestPermission, isSupported } = usePushNotifications()
  const [isVisible, setIsVisible] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (user && isSupported) {
      const currentPermission = Notification.permission
      // Solo mostrar si es 'default' (nunca preguntado)
      // Si es 'denied' o 'granted', no mostrar el banner
      if (currentPermission === "default") {
        const dismissed = localStorage.getItem(`notification-banner-dismissed-${user.userId}`)
        if (!dismissed) {
          setTimeout(() => {
            setIsVisible(true)
            setTimeout(() => setIsAnimating(true), 50)
          }, 2000)
        }
      }
    }
  }, [user, isSupported])

  const handleAllow = async () => {
    try {
      const granted = await requestPermission()
      if (granted) handleClose()
    } catch {
      // requestPermission ya muestra el toast de error
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
      className={`fixed top-20 right-4 z-[9999] w-96 max-w-[calc(100vw-2rem)] transition-all duration-300 ${
        isAnimating ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 backdrop-blur-xl border border-primary/30 rounded-2xl shadow-2xl shadow-primary/20 p-5 relative overflow-hidden">
        {/* Efecto de brillo */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-pulse pointer-events-none" />
        
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
                <button
                  type="button"
                  onClick={handleAllow}
                  className="px-3 py-1.5 text-sm font-medium rounded-md bg-gradient-to-r from-primary to-secondary text-black cursor-pointer"
                >
                  Activar
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-3 py-1.5 text-sm font-medium rounded-md text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Ahora no
                </button>
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
