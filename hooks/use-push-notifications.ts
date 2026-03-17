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
      toast.error(
        "Las notificaciones están bloqueadas. Por favor, habilítalas en la configuración de tu navegador.",
        { duration: 5000 }
      )
      return false
    }

    if (Notification.permission === "granted") {
      toast.success("Notificaciones ya activadas")
      return true
    }

    return new Promise<boolean>((resolve) => {
      Notification.requestPermission().then(async (result) => {
        setPermission(result)
        if (result === "granted") {
          const mockToken = `fcm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          setToken(mockToken)
          try {
            await api.post("/api/device-tokens", { token: mockToken })
          } catch {
            // ignorar
          }
          toast.success("Notificaciones activadas")
          resolve(true)
        } else if (result === "denied") {
          toast.error("Has rechazado las notificaciones.", { duration: 5000 })
          resolve(false)
        } else {
          resolve(false)
        }
      }).catch(() => {
        toast.error("Error al solicitar permisos")
        resolve(false)
      })
    })
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
