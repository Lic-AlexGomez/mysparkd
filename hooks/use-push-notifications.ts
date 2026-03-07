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

    // Verificar si ya fue denegado previamente
    if (Notification.permission === "denied") {
      toast.error(
        "Las notificaciones están bloqueadas. Por favor, habilítalas en la configuración de tu navegador.",
        { duration: 5000 }
      )
      return false
    }

    try {
      const result = await Notification.requestPermission()
      setPermission(result)

      if (result === "granted") {
        // Aquí se registraría el token FCM con Firebase
        // Por ahora simulamos un token
        const mockToken = `fcm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        setToken(mockToken)
        
        // Registrar token en el backend
        await api.post("/api/device-tokens", { token: mockToken })
        toast.success("Notificaciones activadas")
        return true
      } else if (result === "denied") {
        toast.error(
          "Has rechazado las notificaciones. Para activarlas, ve a la configuración de tu navegador.",
          { duration: 5000 }
        )
        return false
      } else {
        // result === "default" - el usuario cerró el diálogo sin responder
        toast.info("No se activaron las notificaciones")
        return false
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error)
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
