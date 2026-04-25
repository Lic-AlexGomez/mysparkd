"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import { CheckCircle2, Loader2, Mail } from "lucide-react"
import { emailVerificationService } from "@/lib/services/email-verification"

function VerifyEmailForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const token = searchParams.get("token") || ""
  const queryEmail = searchParams.get("email") || ""
  const queryUsername = searchParams.get("username") || ""

  const [email, setEmail] = useState(queryEmail)
  const [username, setUsername] = useState(queryUsername)
  const [code, setCode] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [verified, setVerified] = useState(false)
  const [tokenAttempted, setTokenAttempted] = useState(false)

  const identifierLabel = useMemo(() => {
    if (email) return email
    if (username) return `@${username}`
    return "tu cuenta"
  }, [email, username])

  useEffect(() => {
    if (!token || tokenAttempted || verified) return

    const run = async () => {
      setIsVerifying(true)
      try {
        await emailVerificationService.verifyByToken(token)
        setVerified(true)
        toast.success("Email verificado correctamente")
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "No se pudo verificar el enlace")
      } finally {
        setTokenAttempted(true)
        setIsVerifying(false)
      }
    }

    void run()
  }, [token, tokenAttempted, verified])

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) {
      toast.error("Ingresa el código de verificación")
      return
    }
    if (!email.trim() && !username.trim()) {
      toast.error("Ingresa email o usuario")
      return
    }

    setIsVerifying(true)
    try {
      await emailVerificationService.verifyByCode({
        code,
        email: email.trim() || undefined,
        username: username.trim() || undefined,
      })
      setVerified(true)
      toast.success("Email verificado correctamente")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo verificar el código")
    } finally {
      setIsVerifying(false)
    }
  }

  const handleResend = async () => {
    if (!email.trim() && !username.trim()) {
      toast.error("Ingresa email o usuario para reenviar")
      return
    }

    setIsResending(true)
    try {
      await emailVerificationService.resend({
        email: email.trim() || undefined,
        username: username.trim() || undefined,
      })
      toast.success("Te enviamos un nuevo correo de verificación")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo reenviar")
    } finally {
      setIsResending(false)
    }
  }

  return (
    <Card className="border-border bg-card">
      <CardContent className="pt-6">
        {verified ? (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Correo verificado</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Ya puedes iniciar sesión con {identifierLabel}.
              </p>
            </div>
            <Button onClick={() => router.push("/login")} className="w-full bg-primary text-primary-foreground">
              Ir al login
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-sm font-medium text-foreground">Verifica tu correo</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Ingresa el código que enviamos por email o abre el enlace de verificación.
              </p>
            </div>

            <form onSubmit={handleVerifyCode} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isVerifying || isResending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Usuario (opcional)</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="tu_usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isVerifying || isResending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="code">Código de verificación</Label>
                <Input
                  id="code"
                  type="text"
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  disabled={isVerifying || isResending}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isVerifying}>
                {isVerifying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  "Verificar email"
                )}
              </Button>
            </form>

            <Button variant="outline" className="w-full" onClick={handleResend} disabled={isResending || isVerifying}>
              {isResending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Reenviando...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Reenviar verificación
                </>
              )}
            </Button>

            <div className="text-center">
              <Link href="/login" className="text-sm text-primary hover:underline">
                Volver al login
              </Link>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailForm />
    </Suspense>
  )
}

