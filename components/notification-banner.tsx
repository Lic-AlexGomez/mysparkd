'use client'

import { useState, useEffect } from 'react'
import { Bell, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePushNotifications } from '@/hooks/use-push-notifications-simple'

export function NotificationBanner() {
  const [show, setShow] = useState(false)
  const { permission, isSupported, requestPermission } = usePushNotifications()

  useEffect(() => {
    // Mostrar banner si las notificaciones están soportadas y no se han solicitado
    if (isSupported && permission === 'default') {
      const dismissed = localStorage.getItem('notification-banner-dismissed')
      if (!dismissed) {
        setTimeout(() => setShow(true), 3000) // Mostrar después de 3 segundos
      }
    }
  }, [isSupported, permission])

  const handleDismiss = () => {
    setShow(false)
    localStorage.setItem('notification-banner-dismissed', 'true')
  }

  const handleEnable = async () => {
    const granted = await requestPermission()
    if (granted) {
      setShow(false)
    }
  }

  if (!show) return null

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-slide-in lg:left-auto lg:right-4 lg:w-96">
      <div className="bg-card border border-primary/30 rounded-xl p-4 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground mb-1">
              Activa las notificaciones
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Recibe notificaciones de nuevos matches, mensajes y likes
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleEnable}
                className="bg-primary text-primary-foreground"
              >
                Activar
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDismiss}
              >
                Ahora no
              </Button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
