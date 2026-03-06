"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { XCircle } from "lucide-react"

export default function CancelPage() {
  const router = useRouter()

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <Card className="border-border bg-card text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/20">
            <XCircle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-foreground">Pago cancelado</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            No se realizó ningún cargo. Puedes intentar nuevamente cuando quieras.
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push("/feed")}
              className="flex-1 border-border text-foreground"
            >
              Volver al inicio
            </Button>
            <Button
              onClick={() => router.push("/premium")}
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Intentar de nuevo
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
