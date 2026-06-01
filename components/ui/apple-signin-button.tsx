"use client"

import { useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"

interface AppleSignInButtonProps {
  onSuccess: (identityToken: string) => void
  onError?: (error: Error) => void
  text?: string
}

declare global {
  interface Window {
    AppleID?: {
      auth: {
        init: (config: Record<string, unknown>) => void
        signIn: () => Promise<{
          authorization?: { id_token?: string; code?: string }
        }>
      }
    }
  }
}

export function AppleSignInButton({
  onSuccess,
  onError,
  text = "Continuar con Apple",
}: AppleSignInButtonProps) {
  const readyRef = useRef(false)

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID
    const redirectURI = process.env.NEXT_PUBLIC_APPLE_REDIRECT_URI
    if (!clientId || !redirectURI) return

    const script = document.createElement("script")
    script.src = "https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js"
    script.async = true
    script.onload = () => {
      try {
        window.AppleID?.auth.init({
          clientId,
          scope: "name email",
          redirectURI,
          usePopup: true,
        })
        readyRef.current = true
      } catch (e) {
        onError?.(e instanceof Error ? e : new Error("Apple Sign In init failed"))
      }
    }
    document.body.appendChild(script)
    return () => {
      if (document.body.contains(script)) document.body.removeChild(script)
    }
  }, [onError])

  const handleClick = async () => {
    const clientId = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID
    if (!clientId) {
      onError?.(new Error("NEXT_PUBLIC_APPLE_CLIENT_ID no configurado"))
      return
    }
    if (!window.AppleID?.auth) {
      onError?.(new Error("Apple Sign In no disponible"))
      return
    }
    try {
      const res = await window.AppleID.auth.signIn()
      const token = res.authorization?.id_token
      if (!token) throw new Error("No identity token from Apple")
      onSuccess(token)
    } catch (e) {
      onError?.(e instanceof Error ? e : new Error("Apple Sign In failed"))
    }
  }

  if (!process.env.NEXT_PUBLIC_APPLE_CLIENT_ID) return null

  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => void handleClick()}
      className="w-full h-11 bg-black hover:bg-neutral-900 text-white border-neutral-800 font-medium"
    >
      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
      </svg>
      {text}
    </Button>
  )
}
