"use client"

import { useEffect, useState } from "react"
import { Fingerprint, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { ApiError, rateLimitHint } from "@/lib/api"
import {
  isPasskeyHostAllowed,
  isPasskeySupported,
  loginWithPasskey,
} from "@/lib/services/passkey"

type Props = {
  username: string
  disabled?: boolean
  onSuccess: (token: string) => void | Promise<void>
}

export function PasskeyLoginButton({ username, disabled, onSuccess }: Props) {
  const [supported, setSupported] = useState(false)
  const [hostOk, setHostOk] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setSupported(isPasskeySupported())
    setHostOk(isPasskeyHostAllowed())
  }, [])

  if (!supported || !hostOk) return null

  const handlePasskeyLogin = async () => {
    if (!username.trim()) {
      toast.error("Escribe tu usuario para usar passkey")
      return
    }
    setLoading(true)
    try {
      const token = await loginWithPasskey(username.trim())
      await onSuccess(token)
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        toast.error(rateLimitHint(err))
        return
      }
      const message =
        err instanceof Error ? err.message : "No se pudo iniciar sesión con passkey"
      if (message.includes("cancel") || message.includes("abort")) {
        toast.message("Passkey cancelada")
        return
      }
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="h-11 w-full border-border bg-muted/40 hover:bg-muted/70"
      disabled={disabled || loading}
      onClick={() => void handlePasskeyLogin()}
    >
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Fingerprint className="mr-2 h-4 w-4" />
      )}
      Iniciar sesión con passkey
    </Button>
  )
}
