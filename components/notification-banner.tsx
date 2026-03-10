'use client'

import { useState, useEffect } from 'react'
import { Bell, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePushNotifications } from '@/hooks/use-push-notifications-simple'

export function NotificationBanner() {
  const [show, setShow] = useState(false)
  const [isRequesting, setIsRequesting] = useState(false)
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
    console.log('Cerrando banner')
    setShow(false)
    localStorage.setItem('notification-banner-dismissed', 'true')
  }

  const handleEnable = async () => {
    console.log('Botón Activar clickeado')
    if (isRequesting) {
      console.log('Ya hay una solicitud en proceso')
      return
    }
    
    setIsRequesting(true)
    
    try {
      const granted = await requestPermission()
      console.log('Permisos otorgados:', granted)
      if (granted) {
        setShow(false)
        localStorage.setItem('notification-banner-dismissed', 'true')
      }
    } catch (error) {
      console.error('Error en handleEnable:', error)
    } finally {
      setIsRequesting(false)
    }
  }

  if (!show) return null

  return (
    <div className="fixed bottom-20 left-4 right-4 z-[9999] lg:left-auto lg:right-4 lg:w-96">
      <div className="bg-card border-2 border-primary rounded-xl p-4 shadow-2xl">
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
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleEnable()
                }}
                disabled={isRequesting}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 font-medium text-sm"
              >
                {isRequesting ? 'Solicitando...' : 'Activar'}
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleDismiss()
                }}
                disabled={isRequesting}
                className="px-4 py-2 bg-muted text-foreground rounded-md hover:bg-muted/80 disabled:opacity-50 font-medium text-sm"
              >
                Ahora no
              </button>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleDismiss()
            }}
            disabled={isRequesting}
            className="flex-shrink-0 text-muted-foreground hover:text-foreground p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
