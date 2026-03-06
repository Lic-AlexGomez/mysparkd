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
    // Inyectar estilos globales
    const style = document.createElement('style')
    style.id = 'google-btn-custom'
    style.innerHTML = `
      iframe[src*="accounts.google.com"] {
        position: relative !important;
      }
      div[role="button"][aria-labelledby] {
        border-radius: 0.5rem !important;
        border: 2px solid #00e5ff !important;
        background: #1a1b23 !important;
        height: 44px !important;
        overflow: hidden !important;
      }
    `
    if (!document.getElementById('google-btn-custom')) {
      document.head.appendChild(style)
    }

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
    }
  }, [])

  return (
    <div 
      ref={buttonRef} 
      className="w-full"
      style={{
        borderRadius: '0.5rem',
        border: '2px solid #00e5ff',
        background: '#1a1b23',
        overflow: 'hidden',
        height: '44px'
      }}
    />
  )
}
