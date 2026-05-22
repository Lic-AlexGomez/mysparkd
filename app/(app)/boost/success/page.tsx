"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Rocket } from "lucide-react"
import { useI18n } from "@/lib/i18n"

export default function BoostSuccessPage() {
  const router = useRouter()
  const { te } = useI18n()

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <Card className="border-border bg-card text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/20">
            <CheckCircle className="h-8 w-8 text-success" />
          </div>
          <CardTitle className="text-foreground">
            {te("¡Boost activado!", "Boost activated!")}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center justify-center gap-2 text-secondary">
            <Rocket className="h-5 w-5" />
            <span className="font-semibold">{te("Tu post vuelve al feed", "Your post is back in the feed")}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {te(
              "El pago se procesó correctamente. Tu publicación permanecerá visible en los feeds durante 7 días más.",
              "Payment completed. Your post will stay visible in feeds for 7 more days.",
            )}
          </p>
          <Button
            onClick={() => router.push("/feed")}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {te("Ir al feed", "Go to feed")}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
