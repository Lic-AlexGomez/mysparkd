"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>("default")
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission)
    }
  }, [])

  const requestPermission = async () => {
    if (!("Notification" in window)) {
      toast.error("Tu navegador no soporta notificaciones")
      return false
    }

    if (Notification.permission === "denied") {
      toast.error("Notificaciones bloqueadas", {
        description: 'Para activarlas: haz clic en el candado 🔒 en la barra de direcciones → Notificaciones → Permitir',
        duration: 8000
      })
      return false
    }

    if (Notification.permission === "granted") {
      toast.success("Notificaciones ya activadas")
      return true
    }

    try {
      const result = await Notification.requestPermission()
      setPermission(result)

      if (result === "granted") {
        const mockToken = `web_push_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
        setToken(mockToken)
        try {
          const { pushTokenService } = await import("@/lib/services/push-token")
          await pushTokenService.register(mockToken)
        } catch {
          // ignorar
        }
        toast.success("¡Notificaciones activadas!")
        return true
      } else if (result === "denied") {
        toast.error("Notificaciones bloqueadas", {
          description: 'Para activarlas: haz clic en el candado 🔒 en la barra de direcciones → Notificaciones → Permitir',
          duration: 8000
        })
        return false
      }
      return false
    } catch {
      toast.error("Error al solicitar permisos")
      return false
    }
  }

  const sendTestNotification = () => {
    if (permission === "granted") {
      new Notification("Sparkd", {
        body: "¡Notificaciones activadas correctamente!",
        icon: "/icon.svg",
        badge: "/icon.svg",
      })
    }
  }

  return {
    permission,
    token,
    requestPermission,
    sendTestNotification,
    isSupported: typeof window !== "undefined" && "Notification" in window,
  }
}
