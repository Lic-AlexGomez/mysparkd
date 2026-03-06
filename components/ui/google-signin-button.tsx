"use client"

import { useEffect, useRef } from "react"

interface GoogleSignInButtonProps {
  onSuccess: (credential: string) => void
  onError?: (error: Error) => void
  text?: string
}

declare global {
  interface Window {
    google?: any
  }
}

export function GoogleSignInButton({ onSuccess, onError, text = "Continuar con Google" }: GoogleSignInButtonProps) {
  const buttonRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const styleSheet = document.createElement('style')
    styleSheet.textContent = `
      .nsm7Bb-HzV7m-LgbsSe {
        border-radius: 0.5rem !important;
        border: 2px solid hsl(var(--primary) / 1) !important;
        background: hsl(var(--muted)) !important;
        transition: all 0.2s !important;
        height: 44px !important;
        box-shadow: 0 2px 4px 0 rgba(255, 254, 254, 0.1) !important;
      }
      .nsm7Bb-HzV7m-LgbsSe:hover {
        background: hsl(var(--muted) / 0.8) !important;
        border-color: hsl(var(--primary) / 0.6) !important;
        box-shadow: 0 4px 8px -1px rgb(0 0 0 / 0.2) !important;
        transform: translateY(-1px);
      }
      .nsm7Bb-HzV7m-LgbsSe-BPrWId {
        color: whitesmoke !important;
        font-weight: 600 !important;
        font-size: 14px !important;
      }
      .nsm7Bb-HzV7m-LgbsSe-Bz112c {
        margin-right: 12px !important;
      }
    `
    document.head.appendChild(styleSheet)

    const script = document.createElement("script")
    script.src = "https://accounts.google.com/gsi/client"
    script.async = true
    script.defer = true
    
    script.onload = () => {
      if (window.google && buttonRef.current) {
        const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
        
        if (!clientId) {
          console.error('NEXT_PUBLIC_GOOGLE_CLIENT_ID no configurado')
          return
        }

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response: any) => {
            try {
              onSuccess(response.credential)
            } catch (error) {
              onError?.(error instanceof Error ? error : new Error("Error desconocido"))
            }
          },
        })

        window.google.accounts.id.renderButton(
          buttonRef.current,
          {
            theme: "outline",
            size: "large",
            width: buttonRef.current.offsetWidth,
            text: text === "Registrarse con Google" ? "signup_with" : "signin_with",
            shape: "rectangular",
            logo_alignment: "left",
          }
        )
      }
    }

    document.body.appendChild(script)

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
      if (document.head.contains(styleSheet)) {
        document.head.removeChild(styleSheet)
      }
    }
  }, [])

  return <div ref={buttonRef} className="w-full" />
}
