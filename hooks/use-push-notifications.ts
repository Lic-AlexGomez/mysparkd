"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api"
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
        const mockToken = `fcm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        setToken(mockToken)
        try {
          await api.post("/api/device-tokens", { token: mockToken })
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
