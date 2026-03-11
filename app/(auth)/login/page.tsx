"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
import type { UserProfile } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { GoogleSignInButton } from "@/components/ui/google-signin-button"
import { toast } from "sonner"
import { Loader2, Eye, EyeOff } from "lucide-react"

export default function LoginPage() {
  const { login, loginWithGoogle } = useAuth()
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
      // Verificar si el perfil está completo
      try {
        const profile = await api.get<UserProfile>("/api/profile/me")
        if (!profile.profileCompleted) {
          router.push("/onboarding")
        } else {
          router.push("/feed")
        }
      } catch {
        // Si no existe perfil, redirigir al onboarding
        router.push("/onboarding")
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Error al iniciar sesion"
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSuccess = async (credential: string) => {
    setIsLoading(true)
    try {
      await loginWithGoogle(credential)
      try {
        const profile = await api.get<UserProfile>("/api/profile/me")
        if (!profile.profileCompleted) {
          router.push("/onboarding")
        } else {
          router.push("/feed")
        }
      } catch {
        router.push("/onboarding")
      }
    } catch (err) {
      toast.error("Error al iniciar sesión con Google")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-primary/20 bg-background/95 backdrop-blur-xl shadow-2xl shadow-primary/10 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
      <CardContent className="pt-8 pb-6 relative">
        <div className="mb-6 flex flex-col items-center text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Bienvenido de nuevo</h2>
{/*           <p className="text-sm text-muted-foreground">Inicia sesión para continuar</p>
 */}   
      </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="username" className="text-foreground font-medium">
              Usuario
            </Label>
            <Input
              id="username"
              type="text"
              placeholder="Tu nombre de usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-muted/50 border-border text-foreground placeholder:text-muted-foreground h-11 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              disabled={isLoading}
              autoComplete="username"
            />
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-foreground font-medium">
                Contraseña
              </Label>
              <Link
                href="/forgot-password"
                className="text-xs text-primary hover:text-primary/80 hover:underline transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-muted/50 border-border text-foreground placeholder:text-muted-foreground h-11 pr-10 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                disabled={isLoading}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
                <span className="sr-only">
                  {showPassword ? "Ocultar" : "Mostrar"} contraseña
                </span>
              </button>
            </div>
          </div>
          <Button
            type="submit"
            disabled={isLoading}
            className="mt-2 h-11 bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:opacity-90 transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(139,92,246,0.4)] active:scale-95 font-semibold"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Iniciando sesión...
              </>
            ) : (
              "Iniciar sesión"
            )}
          </Button>
        </form>
        
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background/95 px-3 text-muted-foreground font-medium">O continúa con</span>
          </div>
        </div>
        
        <GoogleSignInButton 
          onSuccess={handleGoogleSuccess}
          onError={(error) => toast.error(error.message)}
        />
        
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            ¿No tienes cuenta?{" "}
            <Link href="/register" className="text-primary hover:text-primary/80 font-semibold hover:underline transition-colors">
              Crear cuenta
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
