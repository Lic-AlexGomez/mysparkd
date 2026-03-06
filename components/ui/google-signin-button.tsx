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

        // Forzar estilos con MutationObserver
        const applyStyles = () => {
          const btn = buttonRef.current?.querySelector('.nsm7Bb-HzV7m-LgbsSe') as HTMLElement
          const text = buttonRef.current?.querySelector('.nsm7Bb-HzV7m-LgbsSe-BPrWId') as HTMLElement
          const icon = buttonRef.current?.querySelector('.nsm7Bb-HzV7m-LgbsSe-Bz112c') as HTMLElement
          
          if (btn) {
            btn.style.setProperty('border-radius', '0.5rem', 'important')
            btn.style.setProperty('border', '2px solid hsl(var(--primary))', 'important')
            btn.style.setProperty('background', 'hsl(var(--muted))', 'important')
            btn.style.setProperty('height', '44px', 'important')
            btn.style.setProperty('box-shadow', '0 2px 4px 0 rgba(255, 254, 254, 0.1)', 'important')
          }
          if (text) {
            text.style.setProperty('color', 'whitesmoke', 'important')
            text.style.setProperty('font-weight', '600', 'important')
          }
          if (icon) {
            icon.style.setProperty('margin-right', '12px', 'important')
          }
        }

        setTimeout(applyStyles, 0)
        setTimeout(applyStyles, 100)
        setTimeout(applyStyles, 500)

        const observer = new MutationObserver(applyStyles)
        if (buttonRef.current) {
          observer.observe(buttonRef.current, { childList: true, subtree: true, attributes: true })
        }
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
