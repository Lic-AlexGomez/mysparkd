"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
import type { AccountType, CreateProfileRequest, Interest, Sex } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { toast } from "sonner"
import {
  Loader2,
  ArrowRight,
  ArrowLeft,
  Check,
  Sparkles,
  User,
  Heart,
  SlidersHorizontal,
  Calendar,
  Phone,
} from "lucide-react"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { TOP_10_LANGUAGES, type SupportedLanguage, useI18n } from "@/lib/i18n"

/** Ilustraciones SVG para el selector de modo. */
function SvgModeSocial({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M22 21v-2a4 4 0 0 0-3-3.87"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 3.13a4 4 0 0 1 0 7.75"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function SvgModeDating({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function SvgModeBoth({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M13 2 3 14h8l-1 8l10 -12h-8l1 -8z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const STEP_META = [
  {
    title: "Tu experiencia",
    description: "Elige cómo quieres usar Sparkd. Podrás cambiar esto más adelante.",
    icon: Sparkles,
  },
  {
    title: "Sobre ti",
    description: "Datos básicos para tu perfil y para mejorar las recomendaciones.",
    icon: User,
  },
  {
    title: "Intereses",
    description: "Elige temas que te gusten. Ayuda a encontrar gente afín.",
    icon: Heart,
  },
  {
    title: "Preferencias",
    description: "Ajusta con quién quieres conectar y cómo apareces en búsquedas.",
    icon: SlidersHorizontal,
  },
] as const

export default function OnboardingPage() {
  const { refreshProfile } = useAuth()
  const { language, setLanguage, t, te } = useI18n()
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  const [appMode, setAppMode] = useState<"SOCIAL" | "DATING" | "BOTH">("BOTH")

  const [nombres, setNombres] = useState("")
  const [apellidos, setApellidos] = useState("")
  const [sex, setSex] = useState<Sex>("MALE")
  const [dateOfBirth, setDateOfBirth] = useState("")
  const [telefono, setTelefono] = useState("")
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(
    null
  )

  const [allInterests, setAllInterests] = useState<Interest[]>([])
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])

  const [interestedIn, setInterestedIn] = useState<Sex>("FEMALE")
  const [ageRange, setAgeRange] = useState([18, 35])
  const [showMe, setShowMe] = useState(true)

  const fetchInterests = useCallback(async () => {
    try {
      const data = await api.get<Interest[]>("/api/interests/all/interest")
      setAllInterests(data)
    } catch {
      // silent
    }
  }, [])

  useEffect(() => {
    fetchInterests()
  }, [fetchInterests])

  const handleStep1 = async () => {
    if (!nombres.trim() || !apellidos.trim() || !dateOfBirth) {
      toast.error(te("Completa los campos obligatorios", "Complete required fields"))
      return
    }
    setIsLoading(true)
    try {
      let profileExists = false
      try {
        await api.get("/api/profile/me")
        profileExists = true
      } catch {
        profileExists = false
      }

      const method = profileExists ? "put" : "post"

      let location: { latitude: number; longitude: number } | null = coords
      if (!location && navigator.geolocation) {
        try {
          location = await new Promise((resolve) => {
            navigator.geolocation.getCurrentPosition(
              (pos) =>
                resolve({
                  latitude: pos.coords.latitude,
                  longitude: pos.coords.longitude,
                }),
              () => resolve(null),
              { timeout: 5000, maximumAge: 0 }
            )
          })
          if (location) setCoords(location)
        } catch {
          location = null
        }
      }

      const accountTypeByAppMode: Record<typeof appMode, AccountType> = {
        SOCIAL: "SOCIAL",
        DATING: "DATING",
        BOTH: "BOTH",
      }

      const body: CreateProfileRequest = {
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        sex,
        dateOfBirth,
        ...(telefono.trim() ? { telefono: telefono.trim() } : {}),
        accountType: accountTypeByAppMode[appMode],
        preferredLanguage: language,
      }
      if (location) {
        body.latitude = location.latitude
        body.longitude = location.longitude
      }

      await api[method]("/api/profile", body)
      setStep(2)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : te("Error al guardar perfil", "Error saving profile"))
    } finally {
      setIsLoading(false)
    }
  }

  const handleStep2 = async () => {
    setIsLoading(true)
    try {
      let currentInterests: string[] = []
      try {
        const myInterests = await api.get<Interest[]>("/api/interests/me")
        currentInterests = myInterests.map((i) => i.interestId)
      } catch {
        // ignore
      }

      const newInterests = selectedInterests.filter((id) => !currentInterests.includes(id))

      if (newInterests.length > 0) {
        await Promise.all(
          newInterests.map((interestId) => api.post(`/api/interests/add/${interestId}`))
        )
      }

      setStep(3)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : te("Error al guardar intereses", "Error saving interests"))
    } finally {
      setIsLoading(false)
    }
  }

  const handleStep3 = async () => {
    setIsLoading(true)
    try {
      await api.post("/api/preferences/set/preferences", {
        interestedIn,
        minAge: ageRange[0],
        maxAge: ageRange[1],
        showMe,
      })
      await refreshProfile()
      toast.success(te("¡Listo! Tu perfil está completo.", "Done! Your profile is complete."))
      router.push("/feed")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : te("Error al guardar preferencias", "Error saving preferences"))
    } finally {
      setIsLoading(false)
    }
  }

  const toggleInterest = (id: string) => {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const categoryNames: Record<string, string> = {
    ENTRETENIMIENTO: "Entretenimiento",
    DEPORTE: "Deporte",
    VIAJES: "Viajes",
    ESTILO_DE_VIDA: "Estilo de vida",
    CONOCIMIENTO: "Conocimiento",
    SOCIAL: "Social",
    ARTE: "Arte",
    MUSICA: "Música",
    GASTRONOMIA: "Gastronomía",
    NATURALEZA: "Naturaleza",
    TECNOLOGIA: "Tecnología",
    NEGOCIOS: "Negocios",
    BIENESTAR: "Bienestar",
    CULTURA: "Cultura",
    AVENTURA: "Aventura",
  }

  const categoryEmoji: Record<string, string> = {
    ENTRETENIMIENTO: "🎬",
    DEPORTE: "⚽",
    VIAJES: "✈️",
    ESTILO_DE_VIDA: "☀️",
    CONOCIMIENTO: "📚",
    SOCIAL: "💬",
    ARTE: "🎨",
    MUSICA: "🎵",
    GASTRONOMIA: "🍜",
    NATURALEZA: "🌿",
    TECNOLOGIA: "💻",
    NEGOCIOS: "💼",
    BIENESTAR: "🧘",
    CULTURA: "🎭",
    AVENTURA: "🏕️",
  }

  const categories = [...new Set(allInterests.map((i) => i.category))]

  return (
    <div className="relative flex min-h-dvh w-full min-w-0 flex-col overflow-x-hidden bg-background pt-[env(safe-area-inset-top)] lg:h-dvh lg:max-h-dvh lg:overflow-hidden">
      {/* Degradado centrado (sin anclajes a bordes): evita bandas laterales en móvil */}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/[0.09] via-background to-secondary/[0.06]"
        aria-hidden
      />

      <div className="relative flex w-full flex-1 flex-col min-h-0 max-w-lg min-w-0 px-4 pb-28 pt-6 sm:max-w-xl lg:mx-auto lg:max-h-dvh lg:max-w-xl lg:pb-5 lg:pt-3">
        {/* Progreso: solo timeline de iconos */}
        <div className="mb-4 flex shrink-0 items-center justify-center gap-1 sm:mb-5 sm:gap-2 lg:mb-3">
          {STEP_META.map((meta, i) => {
            const Icon = meta.icon
            const done = i < step
            const current = i === step
            return (
              <div key={meta.title} className="flex items-center gap-1 sm:gap-2">
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full border-2 text-xs font-semibold transition-all sm:h-10 sm:w-10",
                    done && "border-primary bg-primary/15 text-primary",
                    current &&
                      "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/25",
                    !done && !current && "border-border bg-muted/40 text-muted-foreground"
                  )}
                  aria-current={current ? "step" : undefined}
                >
                  {done ? (
                    <Check className="h-4 w-4 sm:h-[18px] sm:w-[18px]" strokeWidth={2.5} />
                  ) : (
                    <Icon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
                  )}
                </div>
                {i < STEP_META.length - 1 && (
                  <div
                    className={cn(
                      "h-0.5 w-3 rounded-full sm:w-8",
                      i < step ? "bg-primary/60" : "bg-border"
                    )}
                    aria-hidden
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* Marca: rayo azul + chispas; titular en tres líneas como pediste */}
        <header className="mb-4 shrink-0 text-center sm:mb-5 lg:mb-3">
          <div className="relative mx-auto mb-5 flex w-full max-w-xs flex-col items-center justify-start sm:mb-6 lg:mb-4">
            <div className="relative mb-4 flex h-[4.75rem] w-full max-w-[12rem] items-center justify-center sm:mb-5 sm:h-[5rem]">
              <div
                className="pointer-events-none absolute inset-x-4 top-1/2 h-16 -translate-y-1/2 rounded-full bg-primary/25 blur-3xl"
                aria-hidden
              />
              <SvgModeBoth className="relative z-10 h-14 w-14 text-primary sm:h-16 sm:w-16" />
              <Sparkles
                className="absolute right-1 top-0 z-20 h-6 w-6 text-primary sm:right-0 sm:h-7 sm:w-7"
                strokeWidth={1.75}
                aria-hidden
              />
              <Sparkles
                className="absolute bottom-1 left-0 z-20 h-5 w-5 text-primary/90 sm:h-6 sm:w-6"
                strokeWidth={1.75}
                aria-hidden
              />
              <span
                className="absolute left-4 top-2 z-20 h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_10px_currentColor] sm:left-3"
                aria-hidden
              />
              <span
                className="absolute right-6 top-8 z-20 h-1 w-1 rounded-full bg-primary sm:right-5"
                aria-hidden
              />
              <span
                className="absolute bottom-3 right-2 z-20 h-1.5 w-1.5 rounded-full bg-primary/80 shadow-[0_0_8px_currentColor]"
                aria-hidden
              />
            </div>
            <div className="space-y-1 text-balance">
              <p className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-2xl">
                Encuentra
              </p>
              <p className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-2xl">
                <span className="text-primary">conexiones</span>{" "}
                <span className="text-foreground">reales</span>
              </p>
            </div>
          </div>
        </header>

        <Card className="flex min-h-0 flex-1 flex-col gap-0 overflow-hidden border-border/80 bg-card/95 py-0 shadow-2xl shadow-black/20 backdrop-blur-sm lg:min-h-0">
          {step === 0 && (
            <>
              <CardHeader className="space-y-1 border-b border-border/60 bg-muted/20 pb-4 lg:pb-3 lg:pt-4">
                <CardTitle className="text-lg text-foreground sm:text-xl lg:text-base">
                  ¿Cómo quieres usar la app?
                </CardTitle>
                <CardDescription className="text-sm lg:text-xs">
                  {te("Puedes cambiar el modo más adelante en ajustes.", "You can change the mode later in settings.")}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto pt-6 lg:gap-3 lg:pt-4 lg:pb-4">
                <div className="rounded-xl border border-primary/25 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 p-4 lg:p-3">
                  <div className="flex gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20">
                      <Sparkles className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0 text-left">
                      <p className="font-semibold text-foreground">{te("Trial premium de bienvenida", "Welcome premium trial")}</p>
                      <p className="mt-1 text-xs leading-snug text-muted-foreground">
                        {te("Swipes ilimitados, sin anuncios y más ventajas al empezar. Los detalles están en tu cuenta.", "Unlimited swipes, no ads and more benefits when starting. Details are in your account.")}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-border/70 bg-muted/20 p-4 lg:p-3">
                  <Label className="text-sm font-medium text-foreground">{t("onboarding.language.title")}</Label>
                  <p className="mt-1 text-xs leading-snug text-muted-foreground">
                    {t("onboarding.language.description")}
                  </p>
                  <Select
                    value={language}
                    onValueChange={(value) => setLanguage(value as SupportedLanguage)}
                  >
                    <SelectTrigger className="mt-3 h-11 bg-background/70 lg:h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TOP_10_LANGUAGES.map((option) => (
                        <SelectItem key={option.code} value={option.code}>
                          {option.nativeLabel} ({option.englishLabel})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-3 lg:gap-2">
                  {(
                    [
                      {
                        mode: "SOCIAL" as const,
                        Illustration: SvgModeSocial,
                        title: "Social",
                        subtitle: "Feed, publicaciones y comunidad.",
                      },
                      {
                        mode: "DATING" as const,
                        Illustration: SvgModeDating,
                        title: te("Conexión", "Connection"),
                        subtitle: te("Encuentros y matching.", "Dates and matching."),
                      },
                      {
                        mode: "BOTH" as const,
                        Illustration: SvgModeBoth,
                        title: te("Todo", "Everything"),
                        subtitle: te("Social y conexión juntos.", "Social and connection together."),
                      },
                    ] as const
                  ).map(({ mode, Illustration, title, subtitle }) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setAppMode(mode)}
                      className={cn(
                        "flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all lg:gap-3 lg:p-3",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                        appMode === mode
                          ? "border-primary bg-primary/10 shadow-md shadow-primary/10"
                          : "border-border bg-muted/20 hover:border-primary/40 hover:bg-muted/40"
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl lg:h-10 lg:w-10",
                          appMode === mode
                            ? "bg-primary/20 text-primary"
                            : "bg-muted/60 text-muted-foreground"
                        )}
                        aria-hidden
                      >
                        <Illustration className="h-7 w-7 lg:h-6 lg:w-6" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-foreground">{title}</h3>
                        <p className="text-sm text-muted-foreground">{subtitle}</p>
                      </div>
                      {appMode === mode && (
                        <Check className="h-5 w-5 shrink-0 text-primary" aria-hidden />
                      )}
                    </button>
                  ))}
                </div>

                <Button
                  type="button"
                  onClick={() => setStep(1)}
                  className="mt-auto h-11 w-full shrink-0 bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 lg:h-10"
                >
                  {t("common.continue")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </>
          )}

          {step === 1 && (
            <>
              <CardHeader className="space-y-2 border-b border-border/60 bg-muted/20 pb-4 lg:pb-3 lg:pt-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    <User className="h-5 w-5" aria-hidden />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <CardTitle className="text-lg text-foreground sm:text-xl lg:text-base">
                      {te("Información básica", "Basic information")}
                    </CardTitle>
                    <CardDescription className="text-sm leading-relaxed lg:text-xs">
                      Completa tu perfil. Los campos con{" "}
                      <span className="font-medium text-primary">*</span> son obligatorios.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex min-h-0 flex-1 flex-col gap-0 overflow-y-auto pt-5 lg:pt-4 lg:pb-4">
                <div className="flex flex-col gap-6 lg:gap-5">
                  {/* Nombre */}
                  <div className="rounded-xl border border-border/60 bg-muted/15 p-4 lg:p-3">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground lg:mb-2">
                      {te("Nombre público", "Public name")}
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2 lg:gap-3">
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="onb-nombres" className="text-sm font-medium text-foreground">
                          {te("Nombres", "First names")} <span className="text-primary">*</span>
                        </Label>
                        <Input
                          id="onb-nombres"
                          value={nombres}
                          onChange={(e) => setNombres(e.target.value)}
                          placeholder={te("Ej. María", "e.g. Maria")}
                          autoComplete="given-name"
                          autoCapitalize="words"
                          className="h-11 border-border/80 bg-background/80 text-foreground shadow-sm transition-colors placeholder:text-muted-foreground/80 focus-visible:border-primary/50 focus-visible:ring-primary/20 lg:h-10"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="onb-apellidos" className="text-sm font-medium text-foreground">
                          {te("Apellidos", "Last names")} <span className="text-primary">*</span>
                        </Label>
                        <Input
                          id="onb-apellidos"
                          value={apellidos}
                          onChange={(e) => setApellidos(e.target.value)}
                          placeholder={te("Ej. García López", "e.g. Garcia Lopez")}
                          autoComplete="family-name"
                          autoCapitalize="words"
                          className="h-11 border-border/80 bg-background/80 text-foreground shadow-sm transition-colors placeholder:text-muted-foreground/80 focus-visible:border-primary/50 focus-visible:ring-primary/20 lg:h-10"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Género — segmentado */}
                  <div>
                    <p className="mb-2 text-sm font-medium text-foreground">
                      {te("Género", "Gender")} <span className="text-primary">*</span>
                    </p>
                    <div
                      className="flex gap-1 rounded-2xl border border-border/70 bg-muted/30 p-1 shadow-inner"
                      role="radiogroup"
                      aria-label={te("Género", "Gender")}
                    >
                      {(["MALE", "FEMALE"] as Sex[]).map((s) => {
                        const sel = sex === s
                        return (
                          <button
                            key={s}
                            type="button"
                            role="radio"
                            aria-checked={sel}
                            onClick={() => setSex(s)}
                            className={cn(
                              "flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all lg:py-2",
                              sel
                                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                                : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                            )}
                          >
                            {s === "MALE" ? te("Hombre", "Man") : te("Mujer", "Woman")}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Fecha */}
                  <div className="rounded-xl border border-border/60 bg-muted/15 p-4 lg:p-3">
                    <div className="mb-3 flex items-center gap-2 lg:mb-2">
                      <Calendar className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                      <Label
                        htmlFor="onb-dob"
                        className="text-sm font-medium leading-none text-foreground"
                      >
                        {te("Fecha de nacimiento", "Date of birth")} <span className="text-primary">*</span>
                      </Label>
                    </div>
                    <Input
                      id="onb-dob"
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      aria-describedby="onb-dob-hint"
                      max={
                        new Date(new Date().setFullYear(new Date().getFullYear() - 18))
                          .toISOString()
                          .split("T")[0]
                      }
                      className="h-11 cursor-pointer border-border/80 bg-background/80 text-foreground shadow-sm [color-scheme:dark] focus-visible:border-primary/50 focus-visible:ring-primary/20 lg:h-10"
                    />
                    <p
                      id="onb-dob-hint"
                      className="mt-2 flex items-start gap-1.5 text-xs leading-snug text-muted-foreground lg:text-[11px]"
                    >
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success opacity-80" aria-hidden />
                      <span>{te("Debes tener al menos 18 años. El calendario usa el formato de tu sistema.", "You must be at least 18 years old. Calendar uses your system format.")}</span>
                    </p>
                  </div>

                  {/* Teléfono */}
                  <div className="rounded-xl border border-dashed border-border/80 bg-muted/10 p-4 lg:p-3">
                    <div className="mb-3 flex items-center gap-2 lg:mb-2">
                      <Phone className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                      <Label htmlFor="onb-phone" className="text-sm font-medium text-foreground">
                        {te("Teléfono", "Phone")}
                      </Label>
                      <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        {te("Opcional", "Optional")}
                      </span>
                    </div>
                    <Input
                      id="onb-phone"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      placeholder="+34 600 000 000"
                      inputMode="tel"
                      autoComplete="tel"
                      className="h-11 border-border/80 bg-background/80 text-foreground shadow-sm placeholder:text-muted-foreground/70 focus-visible:border-primary/50 focus-visible:ring-primary/20 lg:h-10"
                    />
                    <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                      {te("Útil para avisos o recuperar acceso; puedes dejarlo vacío.", "Useful for notices or account recovery; you can leave it empty.")}
                    </p>
                  </div>
                </div>

                <div className="mt-8 flex shrink-0 flex-col-reverse gap-3 border-t border-border/50 pt-5 sm:mt-10 sm:flex-row sm:justify-end lg:mt-8 lg:gap-3 lg:pt-4">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setStep(0)}
                    className="h-12 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground sm:h-11 sm:flex-1 lg:h-10"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t("common.back")}
                  </Button>
                  <Button
                    type="button"
                    onClick={handleStep1}
                    disabled={isLoading}
                    className="h-12 min-w-[min(100%,12rem)] flex-1 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 sm:flex-[2] lg:h-10"
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <ArrowRight className="mr-2 h-4 w-4" />
                    )}
                    {t("common.next")}
                  </Button>
                </div>
              </CardContent>
            </>
          )}

          {step === 2 && (
            <>
              <CardHeader className="space-y-3 border-b border-border/60 bg-muted/20 pb-4 lg:pb-3 lg:pt-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                      <Heart className="h-5 w-5" aria-hidden />
                    </div>
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle className="text-lg text-foreground sm:text-xl lg:text-base">
                          {te("Tus intereses", "Your interests")}
                        </CardTitle>
                        <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                          {te("Opcional", "Optional")}
                        </span>
                      </div>
                      <CardDescription className="text-sm leading-relaxed text-muted-foreground lg:text-xs">
                        {te("Elige temas que te gusten para mejorar recomendaciones y matches. Toca una etiqueta para marcarla o quitarla.", "Choose topics you like to improve recommendations and matches. Tap a tag to add or remove it.")}{" "}
                        <span className="font-medium text-foreground/90">{te("Puedes avanzar sin marcar ninguna.", "You can continue without selecting any.")}</span>
                      </CardDescription>
                    </div>
                  </div>
                  <div
                    className={cn(
                      "flex shrink-0 items-center gap-1.5 self-start rounded-full border px-2.5 py-1.5 text-xs font-semibold sm:self-center",
                      selectedInterests.length > 0
                        ? "border-primary/30 bg-primary/10 text-primary"
                        : "border-border/60 bg-muted/40 text-muted-foreground"
                    )}
                  >
                    <Check className="h-3.5 w-3.5 opacity-70" aria-hidden />
                    {selectedInterests.length === 0
                      ? te("Ninguno aún", "None yet")
                      : `${selectedInterests.length} ${
                          selectedInterests.length === 1 ? te("elegido", "selected") : te("elegidos", "selected")
                        }`}
                  </div>
                </div>
                <p className="text-[11px] leading-relaxed text-muted-foreground sm:pl-[3.25rem] lg:text-[10px]">
                  {te("Varios intereses suelen dar mejores resultados, pero no es obligatorio completar la lista.", "Multiple interests usually improve results, but completing the list is optional.")}
                </p>
              </CardHeader>
              <CardContent className="flex min-h-0 flex-1 flex-col gap-0 overflow-hidden pt-4 lg:pt-3 lg:pb-3">
                <div className="min-h-0 flex-1 space-y-6 overflow-y-auto pr-1 pb-2 pt-1 max-h-[min(52vh,28rem)] [scrollbar-gutter:stable] lg:max-h-none">
                  {categories.map((category) => (
                    <div key={category} className="space-y-3">
                      <div className="flex items-center gap-2.5 px-0.5">
                        <span
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-300/25 via-primary/20 to-secondary/25 text-xl shadow-inner sm:h-12 sm:w-12 sm:text-2xl"
                          aria-hidden
                        >
                          {categoryEmoji[category] ?? "✨"}
                        </span>
                        <div>
                          <h3 className="text-base font-bold leading-tight text-foreground sm:text-lg">
                            {categoryNames[category] || category}
                          </h3>
                          <p className="text-[11px] text-muted-foreground">{te("Toca para añadir o quitar", "Tap to add or remove")}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3">
                        {allInterests
                          .filter((i) => i.category === category)
                          .map((interest) => {
                            const selected = selectedInterests.includes(interest.interestId)
                            return (
                              <button
                                key={interest.interestId}
                                type="button"
                                onClick={() => toggleInterest(interest.interestId)}
                                className={cn(
                                  "relative flex min-h-[4.5rem] flex-col items-center justify-center gap-1 rounded-3xl border-2 px-2 py-2.5 text-center transition-all duration-150 active:scale-[0.97] sm:min-h-[5rem] sm:px-3 sm:py-3",
                                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                                  selected
                                    ? "border-yellow-300 bg-gradient-to-b from-yellow-300 to-amber-400 text-black shadow-[0_4px_14px_rgba(253,224,71,0.35)]"
                                    : "border-transparent bg-muted/45 text-foreground hover:bg-muted/70 hover:shadow-md"
                                )}
                              >
                                {selected && (
                                  <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/80 text-yellow-300 shadow-sm">
                                    <Check className="h-3 w-3 stroke-[3]" aria-hidden />
                                  </span>
                                )}
                                <span
                                  className={cn(
                                    "text-2xl leading-none sm:text-[1.65rem]",
                                    selected && "drop-shadow-sm"
                                  )}
                                  aria-hidden
                                >
                                  {interest.icon || "🏷️"}
                                </span>
                                <span
                                  className={cn(
                                    "line-clamp-2 w-full text-[11px] font-bold leading-tight sm:text-xs",
                                    selected ? "text-black" : "text-foreground"
                                  )}
                                >
                                  {interest.name}
                                </span>
                              </button>
                            )
                          })}
                      </div>
                    </div>
                  ))}
                  {allInterests.length === 0 && (
                    <div className="rounded-xl border border-border/60 bg-muted/15 px-4 py-10 text-center">
                      <Heart className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" aria-hidden />
                      <p className="text-sm text-muted-foreground">
                        {te("No hay intereses por ahora. Puedes continuar y añadirlos después en tu perfil.", "No interests available right now. You can continue and add them later in your profile.")}
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex shrink-0 flex-col-reverse gap-3 border-t border-border/50 pt-5 sm:mt-5 sm:flex-row sm:justify-end lg:gap-3 lg:pt-4">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setStep(1)}
                    className="h-12 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground sm:h-11 sm:flex-1 lg:h-10"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t("common.back")}
                  </Button>
                  <Button
                    type="button"
                    onClick={handleStep2}
                    disabled={isLoading}
                    className="h-12 min-w-[min(100%,12rem)] flex-1 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 sm:flex-[2] lg:h-10"
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <ArrowRight className="mr-2 h-4 w-4" />
                    )}
                    {t("common.next")}
                  </Button>
                </div>
              </CardContent>
            </>
          )}

          {step === 3 && (
            <>
              <CardHeader className="space-y-1 border-b border-border/60 bg-muted/20 pb-4 lg:pb-3 lg:pt-4">
                <CardTitle className="text-lg text-foreground sm:text-xl lg:text-base">{te("Preferencias", "Preferences")}</CardTitle>
                <CardDescription className="text-sm lg:text-xs">
                  {te("Ajusta quién quieres ver y cómo te muestras a los demás.", "Adjust who you want to see and how you appear to others.")}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto pt-6 lg:gap-4 lg:pt-4 lg:pb-4">
                <div className="flex flex-col gap-3 lg:gap-2">
                  <span className="text-sm font-medium text-foreground lg:text-xs">{te("Me interesa conocer", "I want to meet")}</span>
                  <div className="grid grid-cols-2 gap-2">
                    {(["MALE", "FEMALE"] as Sex[]).map((s) => (
                      <Button
                        key={s}
                        type="button"
                        variant={interestedIn === s ? "default" : "outline"}
                        onClick={() => setInterestedIn(s)}
                        className={cn(
                          "h-11 rounded-xl lg:h-9 lg:text-sm",
                          interestedIn === s
                            ? "bg-primary text-primary-foreground shadow-md"
                            : "border-border text-foreground hover:bg-muted"
                        )}
                      >
                        {s === "MALE" ? te("Hombres", "Men") : te("Mujeres", "Women")}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-border/60 bg-muted/30 p-4 lg:p-3">
                  <div className="mb-3 flex items-center justify-between gap-2 lg:mb-2">
                    <span className="text-sm font-medium text-foreground lg:text-xs">{te("Rango de edad", "Age range")}</span>
                    <span className="rounded-md bg-background/80 px-2 py-1 font-mono text-sm tabular-nums text-primary">
                      {ageRange[0]} – {ageRange[1]} {te("años", "years")}
                    </span>
                  </div>
                  <Slider
                    value={ageRange}
                    onValueChange={setAgeRange}
                    min={18}
                    max={60}
                    step={1}
                    className="w-full py-2"
                  />
                  <p className="mt-2 text-xs text-muted-foreground lg:mt-1 lg:text-[11px]">
                    {te("Ajusta el mínimo y máximo con los dos controles del deslizador.", "Adjust min and max using the two slider handles.")}
                  </p>
                </div>

                <div className="flex flex-col gap-2 rounded-xl border border-border/60 bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between lg:gap-3 lg:p-3">
                  <div className="space-y-0.5">
                    <Label htmlFor="onb-showme" className="text-foreground cursor-pointer text-base">
                      {te("Aparecer en búsquedas", "Appear in search")}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {te("Si lo desactivas, serás menos visible para nuevas personas.", "If disabled, you'll be less visible to new people.")}
                    </p>
                  </div>
                  <Switch
                    id="onb-showme"
                    checked={showMe}
                    onCheckedChange={setShowMe}
                    className="shrink-0 data-[state=checked]:bg-primary"
                  />
                </div>

                <div className="mt-auto flex shrink-0 flex-col-reverse gap-3 pt-2 sm:flex-row lg:gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(2)}
                    className="h-11 flex-1 border-border lg:h-10"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t("common.back")}
                  </Button>
                  <Button
                    type="button"
                    onClick={handleStep3}
                    disabled={isLoading}
                    className="h-11 flex-[2] bg-gradient-to-r from-primary to-secondary text-black font-semibold shadow-lg hover:opacity-95 lg:h-10"
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="mr-2 h-4 w-4" />
                    )}
                    {te("Entrar a Sparkd", "Enter Sparkd")}
                  </Button>
                </div>
              </CardContent>
            </>
          )}
        </Card>

        <p className="mt-4 shrink-0 text-center text-xs text-muted-foreground lg:mt-2 lg:text-[10px]">
          {te("Al continuar confirmas que la información es correcta.", "By continuing, you confirm the information is correct.")}
        </p>
      </div>
    </div>
  )
}
