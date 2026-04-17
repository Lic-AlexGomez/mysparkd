'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSupported, setIsSupported] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)

  useEffect(() => {
    setIsSupported('Notification' in window && 'serviceWorker' in navigator)
    if ('Notification' in window) {
      setPermission(Notification.permission)
    }
  }, [])

  const requestPermission = async () => {
    if (!isSupported) {
      toast.error('Las notificaciones no están soportadas en este navegador')
      return false
    }

    try {
      console.log('Solicitando permisos de notificación...')
      const result = await Notification.requestPermission()
      console.log('Resultado de permisos:', result)
      setPermission(result)
      
      if (result === 'granted') {
        try {
          await registerServiceWorker()
          toast.success('¡Notificaciones activadas!')
          return true
        } catch (swError) {
          console.error('Error al registrar SW:', swError)
          toast.success('Notificaciones activadas')
          return true
        }
      } else if (result === 'denied') {
        toast.error('Notificaciones bloqueadas', {
          description: 'Haz clic en el candado 🔒 en la barra de direcciones → Notificaciones → Permitir',
          duration: 8000
        })
        return false
      } else {
        // 'default' - usuario cerró el popup sin decidir
        return false
      }
    } catch (error) {
      console.error('Error al solicitar permisos:', error)
      toast.error('Error al activar notificaciones')
      return false
    }
  }

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw-notifications.js')
      console.log('Service Worker registrado:', registration)
      setIsSubscribed(true)
      return registration
    } catch (error) {
      console.error('Error al registrar Service Worker:', error)
      throw error
    }
  }

  const showNotification = async (title: string, options?: NotificationOptions) => {
    if (permission !== 'granted') {
      const granted = await requestPermission()
      if (!granted) return
    }

    try {
      const registration = await navigator.serviceWorker.ready
      await registration.showNotification(title, {
        icon: '/icon.png',
        badge: '/icon.png',
        ...options
      })
    } catch (error) {
      console.error('Error al mostrar notificación:', error)
    }
  }

  return {
    permission,
    isSupported,
    isSubscribed,
    requestPermission,
    showNotification
  }
}
