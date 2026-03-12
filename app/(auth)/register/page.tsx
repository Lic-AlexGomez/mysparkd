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

export default function RegisterPage() {
  const { register, login, loginWithGoogle } = useAuth()
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !email.trim() || !password.trim()) {
      toast.error("Completa todos los campos")
      return
    }
    if (username.trim().length < 3) {
      toast.error("El usuario debe tener al menos 3 caracteres")
      return
    }
    if (password.length < 6) {
      toast.error("La contrasena debe tener al menos 6 caracteres")
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast.error("Ingresa un email valido")
      return
    }

    setIsLoading(true)
    try {
      await register({
        username: username.trim(),
        email: email.trim(),
        password,
      })
      toast.success("Cuenta creada!")
      // Login automático después del registro
      await login({ username: username.trim(), password })
      router.push("/onboarding")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al registrarse")
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
      toast.error("Error al registrarse con Google")
    } finally {
      setIsLoading(false)
    }
  }

  const passwordStrength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3

  return (
    <Card className="border-primary/20 bg-background/95 backdrop-blur-xl shadow-2xl shadow-primary/10 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
      <CardContent className="pt-6 pb-4 relative">
        <div className="mb-4 flex flex-col items-center text-center">
          <h2 className="text-xl font-bold text-foreground">Crear cuenta</h2>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="username" className="text-foreground font-medium">
              Usuario
            </Label>
            <Input
              id="username"
              type="text"
              placeholder="Elige un nombre de usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-muted/50 border-border text-foreground placeholder:text-muted-foreground h-11 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              disabled={isLoading}
              autoComplete="username"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email" className="text-foreground font-medium">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-muted/50 border-border text-foreground placeholder:text-muted-foreground h-11 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              disabled={isLoading}
              autoComplete="email"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password" className="text-foreground font-medium">
              Contrasena
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Minimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-muted/50 border-border text-foreground placeholder:text-muted-foreground h-11 pr-10 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                disabled={isLoading}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                <span className="sr-only">{showPassword ? "Ocultar" : "Mostrar"} contrasena</span>
              </button>
            </div>
            {password.length > 0 && (
              <div className="flex gap-1">
                {[1, 2, 3].map((level) => (
                  <div
                    key={level}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      passwordStrength >= level
                        ? level === 1
                          ? "bg-destructive"
                          : level === 2
                            ? "bg-accent"
                            : "bg-success"
                        : "bg-muted"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
          <Button
            type="submit"
            disabled={isLoading}
            className="mt-1 h-11 bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:opacity-90 transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(139,92,246,0.4)] active:scale-95 font-semibold"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creando cuenta...
              </>
            ) : (
              "Crear cuenta"
            )}
          </Button>
        </form>
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background/95 px-3 text-muted-foreground font-medium my-1">O continúa con</span>
          </div>
        </div>
        <GoogleSignInButton 
          onSuccess={handleGoogleSuccess}
          onError={(error) => toast.error(error.message)}
          text="Registrarse con Google"
        />
        <div className="mt-4 text-center">
          <p className="text-sm text-muted-foreground">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="text-primary hover:text-primary/80 font-semibold hover:underline transition-colors">
              Iniciar sesión
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
