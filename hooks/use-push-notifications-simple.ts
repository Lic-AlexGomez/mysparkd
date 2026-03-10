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
      const result = await Notification.requestPermission()
      setPermission(result)
      
      if (result === 'granted') {
        await registerServiceWorker()
        toast.success('Notificaciones activadas')
        return true
      } else {
        toast.error('Permisos de notificación denegados')
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
