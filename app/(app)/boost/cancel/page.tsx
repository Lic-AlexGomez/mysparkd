"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { XCircle } from "lucide-react"
import { useI18n } from "@/lib/i18n"

export default function BoostCancelPage() {
  const router = useRouter()
  const { te } = useI18n()

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <Card className="border-border bg-card text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/20">
            <XCircle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-foreground">{te("Pago cancelado", "Payment canceled")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            {te(
              "No se realizó ningún cargo. Puedes intentar el boost de nuevo desde tus posts.",
              "No charge was made. You can try boosting again from your posts.",
            )}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push("/feed")}
              className="flex-1 border-border text-foreground"
            >
              {te("Volver al feed", "Back to feed")}
            </Button>
            <Button
              onClick={() => router.push("/profile")}
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {te("Mis posts", "My posts")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
