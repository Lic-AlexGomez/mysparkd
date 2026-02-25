"use client"

import { useState } from "react"
import Link from "next/link"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import { Loader2, ArrowLeft, Mail } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      toast.error("Ingresa tu email")
      return
    }
    setIsLoading(true)
    try {
      await api.post("/auth/forgot-password", { email: email.trim() })
      setSent(true)
      toast.success("Revisa tu correo")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al enviar")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-border bg-card">
      <CardContent className="pt-6">
        {sent ? (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <div className="text-center">
              <h2 className="text-lg font-semibold text-foreground">
                Correo enviado
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Revisa tu bandeja de entrada para restablecer tu contrasena.
              </p>
            </div>
            <Link href="/login">
              <Button variant="outline" className="border-border text-foreground">
                Volver al login
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="email" className="text-foreground">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
                  disabled={isLoading}
                />
              </div>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Enviar enlace de recuperacion"
                )}
              </Button>
            </form>
            <div className="mt-4 text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-3 w-3" />
                Volver al login
              </Link>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
