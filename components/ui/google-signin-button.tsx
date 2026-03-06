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

        // Aplicar estilos después del render
        setTimeout(() => {
          const container = buttonRef.current?.querySelector('#container-div') as HTMLElement
          const button = buttonRef.current?.querySelector('.nsm7Bb-HzV7m-LgbsSe') as HTMLElement
          const text = buttonRef.current?.querySelector('.nsm7Bb-HzV7m-LgbsSe-BPrWId') as HTMLElement
          
          if (container) container.style.padding = '0'
          if (button) {
            button.style.borderRadius = '0.5rem'
            button.style.border = '2px solid #00e5ff'
            button.style.background = '#1a1b23'
            button.style.height = '44px'
            button.style.boxShadow = '0 2px 4px 0 rgba(255, 254, 254, 0.1)'
          }
          if (text) {
            text.style.color = 'whitesmoke'
            text.style.fontWeight = '600'
          }
        }, 100)
      }
    }

    document.body.appendChild(script)

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [])

  return <div ref={buttonRef} className="w-full" />
}
