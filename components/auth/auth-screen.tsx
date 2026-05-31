"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Check,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Sparkles,
  User,
  X,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { resolveAuthError, showAuthErrorToast } from "@/lib/auth-user-messages"
import {
  loadRememberedLoginUsername,
  setRememberLoginUsername,
} from "@/lib/remember-login-username"
import {
  REGISTRATION_PASSWORD_HINT,
  checkRegistrationPasswordRules,
  getRegistrationPasswordError,
} from "@/lib/password-policy"
import { AUTH_PLACEHOLDERS } from "@/lib/auth-placeholders"
import { AuthCard } from "@/components/auth/auth-card"
import { GoogleSignInButton } from "@/components/ui/google-signin-button"
import { AppleSignInButton } from "@/components/ui/apple-signin-button"
import { PasskeyLoginButton } from "@/components/auth/passkey-login-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

type AuthMode = "login" | "register"

type AuthScreenProps = {
  defaultMode?: AuthMode
}

export function AuthScreen({ defaultMode = "login" }: AuthScreenProps) {
  const router = useRouter()
  const pathname = usePathname() ?? ""
  const { login, register, loginWithGoogle, loginWithApple, loginWithPasskey } = useAuth()

  const [mode, setMode] = useState<AuthMode>(
    defaultMode ?? (pathname.includes("/register") ? "register" : "login")
  )
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [rememberUsername, setRememberUsername] = useState(false)

  const isLogin = mode === "login"
  const passwordRules = checkRegistrationPasswordRules(password)

  useEffect(() => {
    if (!pathname) return
    setMode(pathname.includes("/register") ? "register" : "login")
  }, [pathname])

  useEffect(() => {
    const { remember, username: saved } = loadRememberedLoginUsername()
    setRememberUsername(remember)
    if (saved) setUsername(saved)
  }, [])

  const switchMode = (next: AuthMode) => {
    setMode(next)
    setPassword("")
    setShowPassword(false)
    router.replace(next === "register" ? "/register" : "/login")
  }

  const persistRememberUsername = (name: string) => {
    setRememberLoginUsername(rememberUsername, name)
  }

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      toast.error("Completa todos los campos")
      return
    }
    setLoading(true)
    try {
      const name = username.trim()
      await login({ username: name, password })
      persistRememberUsername(name)
    } catch (err) {
      const present = resolveAuthError(err, "login", { username: username.trim(), email: email.trim() })
      showAuthErrorToast(present, toast)
      if (present.redirectToVerify) {
        const qs = new URLSearchParams()
        if (present.redirectToVerify.username) qs.set("username", present.redirectToVerify.username)
        if (present.redirectToVerify.email) qs.set("email", present.redirectToVerify.email)
        router.push(`/verify-email?${qs.toString()}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async () => {
    if (!username.trim() || !email.trim() || !password.trim()) {
      toast.error("Completa todos los campos")
      return
    }
    if (username.trim().length < 3) {
      toast.error("El usuario debe tener al menos 3 caracteres")
      return
    }
    const pwdErr = getRegistrationPasswordError(password)
    if (pwdErr) {
      toast.error(pwdErr)
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      toast.error("Ingresa un email válido")
      return
    }

    setLoading(true)
    try {
      const result = await register({
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password,
      })
      const regResponse = result as { message?: string } | undefined
      if (regResponse?.message?.includes("Si encontramos una cuenta")) {
        toast.success(regResponse.message)
      } else {
        toast.success(
          "Revisa tu correo. Si encontramos una cuenta asociada, te enviaremos instrucciones para continuar."
        )
      }
      localStorage.setItem("sparkd_pending_verification_email", email.trim())
      router.push(
        `/verify-email?email=${encodeURIComponent(email.trim())}&username=${encodeURIComponent(username.trim())}`
      )
    } catch (err) {
      const present = resolveAuthError(err, "register", {
        username: username.trim(),
        email: email.trim(),
      })
      showAuthErrorToast(present, toast)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    void (isLogin ? handleLogin() : handleRegister())
  }

  return (
    <AuthCard>
      <div className="mb-4 flex flex-col items-center gap-1 text-center">
        <Sparkles className="h-5 w-5 text-primary" />
        <h2 className="text-2xl font-extrabold tracking-wide text-foreground">
          {isLogin ? "Bienvenido de nuevo" : "Crear cuenta"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {isLogin ? "Inicia sesión en Sparkd" : "Únete a la comunidad Sparkd"}
        </p>
      </div>

      <div className="mb-4 flex rounded-lg bg-muted/80 p-1">
        <button
          type="button"
          onClick={() => switchMode("login")}
          className={cn(
            "flex-1 rounded-md py-2 text-sm font-semibold transition-all",
            isLogin
              ? "bg-card text-primary shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Iniciar sesión
        </button>
        <button
          type="button"
          onClick={() => switchMode("register")}
          className={cn(
            "flex-1 rounded-md py-2 text-sm font-semibold transition-all",
            !isLogin
              ? "bg-card text-primary shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Crear cuenta
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="auth-username" className="text-foreground">
            Usuario
          </Label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="auth-username"
              type="text"
              placeholder={isLogin ? AUTH_PLACEHOLDERS.usernameLogin : AUTH_PLACEHOLDERS.usernameRegister}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="h-11 border-border bg-muted/40 pl-10 placeholder:text-muted-foreground/70"
              disabled={loading}
              autoComplete="username"
            />
          </div>
        </div>

        {isLogin ? (
          <label className="flex cursor-pointer items-center gap-2.5">
            <input
              type="checkbox"
              checked={rememberUsername}
              onChange={(e) => {
                const next = e.target.checked
                setRememberUsername(next)
                setRememberLoginUsername(next, next ? username : undefined)
              }}
              disabled={loading}
              className="h-4 w-4 rounded border-border accent-primary"
            />
            <span className="text-sm font-medium text-foreground">Recordar usuario</span>
          </label>
        ) : (
          <div className="space-y-1.5">
            <Label htmlFor="auth-email" className="text-foreground">
              Email
            </Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="auth-email"
                type="email"
                placeholder={AUTH_PLACEHOLDERS.emailRegister}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 border-border bg-muted/40 pl-10 placeholder:text-muted-foreground/70"
                disabled={loading}
                autoComplete="email"
              />
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="auth-password" className="text-foreground">
              Contraseña
            </Label>
            {isLogin ? (
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-primary hover:text-primary/80 hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            ) : null}
          </div>
          {!isLogin && password.length === 0 ? (
            <p className="text-xs text-muted-foreground">{REGISTRATION_PASSWORD_HINT}</p>
          ) : null}
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="auth-password"
              type={showPassword ? "text" : "password"}
              placeholder={isLogin ? AUTH_PLACEHOLDERS.passwordLogin : AUTH_PLACEHOLDERS.passwordRegister}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 border-border bg-muted/40 pl-10 pr-10 placeholder:text-muted-foreground/70"
              disabled={loading}
              autoComplete={isLogin ? "current-password" : "new-password"}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {!isLogin && password.length > 0 ? (
            <ul
              className={cn(
                "space-y-1 rounded-lg border px-3 py-2 text-xs",
                passwordRules.every((r) => r.ok)
                  ? "border-emerald-500/30 bg-emerald-500/5"
                  : "border-border bg-muted/30"
              )}
              aria-live="polite"
            >
              {passwordRules.map((rule) => (
                <li
                  key={rule.id}
                  className={cn(
                    "flex items-center gap-2 font-medium",
                    rule.ok ? "text-emerald-500" : "text-muted-foreground"
                  )}
                >
                  {rule.ok ? (
                    <Check className="h-3.5 w-3.5 shrink-0" />
                  ) : (
                    <X className="h-3.5 w-3.5 shrink-0 text-destructive" />
                  )}
                  {rule.label}
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-1 flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-primary/50 bg-gradient-to-r from-primary to-secondary text-base font-extrabold text-primary-foreground shadow-[0_3px_14px_rgba(0,229,255,0.25)] transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {isLogin ? "Iniciando sesión…" : "Creando cuenta…"}
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              {isLogin ? "Iniciar sesión" : "Crear cuenta"}
            </>
          )}
        </button>
      </form>

      {isLogin ? (
        <div className="mt-3">
          <PasskeyLoginButton
            username={username}
            disabled={loading}
            onSuccess={async (token) => {
              setLoading(true)
              try {
                await loginWithPasskey(token)
                persistRememberUsername(username.trim())
              } catch (err) {
                showAuthErrorToast(resolveAuthError(err, "passkey"), toast)
              } finally {
                setLoading(false)
              }
            }}
          />
        </div>
      ) : null}

      <div className="relative my-4 flex items-center gap-3">
        <div className="h-px flex-1 bg-border/80" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          O continúa con
        </span>
        <div className="h-px flex-1 bg-border/80" />
      </div>

      <GoogleSignInButton
        text={isLogin ? "Continuar con Google" : "Registrarse con Google"}
        onSuccess={async (credential) => {
          setLoading(true)
          try {
            await loginWithGoogle(credential)
          } catch (err) {
            showAuthErrorToast(resolveAuthError(err, "google"), toast)
          } finally {
            setLoading(false)
          }
        }}
        onError={(error) => showAuthErrorToast(resolveAuthError(error, "google"), toast)}
      />

      <AppleSignInButton
        text={isLogin ? "Continuar con Apple" : "Registrarse con Apple"}
        onSuccess={async (identityToken) => {
          setLoading(true)
          try {
            await loginWithApple(identityToken)
          } catch (err) {
            showAuthErrorToast(resolveAuthError(err, "apple"), toast)
          } finally {
            setLoading(false)
          }
        }}
        onError={(error) => showAuthErrorToast(resolveAuthError(error, "apple"), toast)}
      />
    </AuthCard>
  )
}
