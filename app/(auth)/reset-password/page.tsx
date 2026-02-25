"use client"

import { useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token") || ""
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPassword || !confirmPassword) {
      toast.error("Completa todos los campos")
      return
    }
    if (newPassword.length < 6) {
      toast.error("Minimo 6 caracteres")
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error("Las contrasenas no coinciden")
      return
    }
    setIsLoading(true)
    try {
      await api.post("/auth/reset-password", { token, newPassword })
      toast.success("Contrasena actualizada!")
      router.push("/login")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al restablecer")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-border bg-card">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="newPassword" className="text-foreground">
              Nueva contrasena
            </Label>
            <Input
              id="newPassword"
              type="password"
              placeholder="Minimo 6 caracteres"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
              disabled={isLoading}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="confirmPassword" className="text-foreground">
              Confirmar contrasena
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Repite tu contrasena"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
              disabled={isLoading}
            />
          </div>
          <Button
            type="submit"
            disabled={isLoading}
            className="mt-2 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Actualizando...
              </>
            ) : (
              "Restablecer contrasena"
            )}
          </Button>
        </form>
        <div className="mt-4 text-center">
          <Link href="/login" className="text-sm text-primary hover:underline">
            Volver al login
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  )
}
