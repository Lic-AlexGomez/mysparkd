"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Loader2, Crown } from "lucide-react"

export default function SuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { refreshProfile } = useAuth()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const sessionId = searchParams.get("session_id")
    if (sessionId) {
      refreshProfile().finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [searchParams, refreshProfile])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <Card className="border-border bg-card text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/20">
            <CheckCircle className="h-8 w-8 text-success" />
          </div>
          <CardTitle className="text-foreground">¡Pago exitoso!</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center justify-center gap-2 text-primary">
            <Crown className="h-5 w-5" />
            <span className="font-semibold">Ahora eres Premium</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Tu suscripción ha sido activada. Disfruta de todas las funciones premium.
          </p>
          <Button
            onClick={() => router.push("/feed")}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Ir al inicio
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
