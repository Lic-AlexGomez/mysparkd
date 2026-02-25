"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import { Loader2, Eye, EyeOff } from "lucide-react"

export default function LoginPage() {
  const { login } = useAuth()
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password.trim()) {
      toast.error("Completa todos los campos")
      return
    }
    setIsLoading(true)
    try {
      await login({ username: username.trim(), password })
      router.push("/feed")
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Error al iniciar sesion"
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-border bg-card">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="username" className="text-foreground">
              Usuario
            </Label>
            <Input
              id="username"
              type="text"
              placeholder="Tu nombre de usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
              disabled={isLoading}
              autoComplete="username"
            />
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-foreground">
                Contrasena
              </Label>
              <Link
                href="/forgot-password"
                className="text-xs text-primary hover:underline"
              >
                Olvidaste tu contrasena?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Tu contrasena"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-muted border-border text-foreground placeholder:text-muted-foreground pr-10"
                disabled={isLoading}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
                <span className="sr-only">
                  {showPassword ? "Ocultar" : "Mostrar"} contrasena
                </span>
              </button>
            </div>
          </div>
          <Button
            type="submit"
            disabled={isLoading}
            className="mt-2 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Iniciando sesion...
              </>
            ) : (
              "Iniciar sesion"
            )}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          No tienes cuenta?{" "}
          <Link href="/register" className="text-primary hover:underline">
            Crear cuenta
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
