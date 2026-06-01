"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
import type { AccountType, CreateProfileRequest, Interest, InterestedIn, Sex } from "@/lib/types"
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
  Camera,
  Palette,
} from "lucide-react"
import { OnboardingAppearanceStep } from "@/components/appearance/onboarding-appearance-step"
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
import { SparkBackground } from "@/components/marketing/spark-background"

function ageFromDateOfBirth(isoDate: string): number | null {
  if (!isoDate) return null
  const dob = new Date(isoDate)
  if (Number.isNaN(dob.getTime())) return null
  const today = new Date()
  let age = today.getFullYear() - dob.getFullYear()
  const m = today.getMonth() - dob.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--
  return age
}

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

export default function OnboardingPage() {
  const { refreshProfile } = useAuth()
  const { language, setLanguage, t } = useI18n()

  const stepMeta = useMemo(
    () =>
      [
        {
          title: t("onboarding.step0.title"),
          description: t("onboarding.step0.description"),
          icon: Sparkles,
        },
        {
          title: t("onboarding.appearance.title"),
          description: t("onboarding.appearance.description"),
          icon: Palette,
        },
        {
          title: t("onboarding.step1.title"),
          description: t("onboarding.step1.description"),
          icon: User,
        },
        {
          title: t("onboarding.step2.title"),
          description: t("onboarding.step2.description"),
          icon: Heart,
        },
        {
          title: t("onboarding.step3.title"),
          description: t("onboarding.step3.description"),
          icon: SlidersHorizontal,
        },
      ] as const,
    [t]
  )
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  const [appMode, setAppMode] = useState<"SOCIAL" | "DATING" | "BOTH">("BOTH")

  const [nombres, setNombres] = useState("")
  const [apellidos, setApellidos] = useState("")
  const [sex, setSex] = useState<Sex>("MALE")
  const [dateOfBirth, setDateOfBirth] = useState("")
  const [telefono, setTelefono] = useState("")
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(
    null
  )

  const [allInterests, setAllInterests] = useState<Interest[]>([])
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])

  const [interestedIn, setInterestedIn] = useState<InterestedIn>("FEMALE")
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

  const handlePhotoPick = (file: File | null) => {
    if (!file) return
    setPhotoFile(file)
    if (photoPreview) URL.revokeObjectURL(photoPreview)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const handleStep1 = async () => {
    if (!nombres.trim() || !apellidos.trim() || !dateOfBirth) {
      toast.error(t("onboarding.error.requiredFields"))
      return
    }
    const age = ageFromDateOfBirth(dateOfBirth)
    if (age === null || age < 18) {
      toast.error(t("onboarding.error.ageMin"))
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
      if (photoFile) {
        const toastId = toast.loading(t("onboarding.photo.uploading"))
        try {
          const fd = new FormData()
          fd.append("file", photoFile)
          await api.post("/api/photos/profile-picture", fd)
          toast.dismiss(toastId)
          toast.success(t("onboarding.photo.success"))
        } catch {
          toast.dismiss(toastId)
          toast.error(t("onboarding.photo.error"))
        }
      }
      setStep(3)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("onboarding.error.saveProfile"))
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

      setStep(4)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("onboarding.error.saveInterests"))
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
      toast.success(t("onboarding.success.complete"))
      router.push("/feed")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("onboarding.error.savePreferences"))
    } finally {
      setIsLoading(false)
    }
  }

  const toggleInterest = (id: string) => {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const categoryLabel = useCallback(
    (category: string) => {
      const key = `onboarding.category.${category}`
      const label = t(key)
      return label === key ? category : label
    },
    [t]
  )

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
    <SparkBackground className="min-h-dvh lg:h-dvh lg:max-h-dvh lg:overflow-hidden">
      <div className="pointer-events-none absolute -left-20 -top-20 h-[280px] w-[280px] rounded-full bg-[#8B5CF6]/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-[320px] w-[320px] rounded-full bg-[#EC4899]/20 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-[38%] h-[200px] w-[200px] -translate-x-1/2 rounded-full bg-[#3B82F6]/10 blur-3xl" />

      <div className="relative flex w-full flex-1 flex-col min-h-0 max-w-lg min-w-0 px-4 pb-28 pt-6 sm:max-w-xl lg:mx-auto lg:max-h-dvh lg:max-w-xl lg:pb-5 lg:pt-3">
        {/* Progreso: solo timeline de iconos */}
        <div className="mb-4 flex shrink-0 flex-col items-center gap-2 sm:mb-5 lg:mb-3">
          <div className="flex items-center justify-center gap-1 sm:gap-2">
            {stepMeta.map((meta, i) => {
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
                    title={meta.title}
                  >
                    {done ? (
                      <Check className="h-4 w-4 sm:h-[18px] sm:w-[18px]" strokeWidth={2.5} />
                    ) : (
                      <Icon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
                    )}
                  </div>
                  {i < stepMeta.length - 1 && (
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
          <div className="text-center">
            <p className="text-sm font-semibold text-foreground">{stepMeta[step]?.title}</p>
            <p className="text-xs text-muted-foreground">{stepMeta[step]?.description}</p>
          </div>
        </div>

        {/* Header hero removido por petición */}        

        <Card className="flex min-h-0 flex-1 flex-col gap-0 overflow-hidden border-border/80 bg-card/95 py-0 shadow-2xl shadow-black/20 backdrop-blur-sm lg:min-h-0">
          {step === 0 && (
            <>
              <CardHeader className="space-y-1 border-b border-border/60 bg-muted/20 pb-4 lg:pb-3 lg:pt-4">
                <CardTitle className="text-lg text-foreground sm:text-xl lg:text-base">
                  {t("onboarding.step0.cardTitle")}
                </CardTitle>
                <CardDescription className="text-sm lg:text-xs">
                  {t("onboarding.step0.changeLater")}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto pt-6 lg:gap-3 lg:pt-4 lg:pb-4">
                <div className="rounded-xl border border-primary/25 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 p-4 lg:p-3">
                  <div className="flex gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20">
                      <Sparkles className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0 text-left">
                      <p className="font-semibold text-foreground">{t("onboarding.trial.title")}</p>
                      <p className="mt-1 text-xs leading-snug text-muted-foreground">
                        {t("onboarding.trial.description")}
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

                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {(
                    [
                      {
                        mode: "SOCIAL" as const,
                        Illustration: SvgModeSocial,
                        title: t("onboarding.mode.social.title"),
                        subtitle: t("onboarding.mode.social.subtitle"),
                      },
                      {
                        mode: "DATING" as const,
                        Illustration: SvgModeDating,
                        title: t("onboarding.mode.dating.title"),
                        subtitle: t("onboarding.mode.dating.subtitle"),
                      },
                      {
                        mode: "BOTH" as const,
                        Illustration: SvgModeBoth,
                        title: t("onboarding.mode.both.title"),
                        subtitle: t("onboarding.mode.both.subtitle"),
                      },
                    ] as const
                  ).map(({ mode, Illustration, title, subtitle }) => {
                    const selected = appMode === mode
                    return (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setAppMode(mode)}
                        aria-pressed={selected}
                        className={cn(
                          "group relative flex min-h-[8.5rem] flex-col items-center justify-start gap-2 rounded-2xl border-2 px-2 pb-3 pt-3 text-center transition-all sm:min-h-[9rem] sm:px-3 sm:pb-4",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                          selected
                            ? "border-primary bg-gradient-to-b from-primary/15 to-primary/5 shadow-lg shadow-primary/15"
                            : "border-border/80 bg-muted/15 hover:border-primary/35 hover:bg-muted/30"
                        )}
                      >
                        {selected ? (
                          <span
                            className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm sm:right-2 sm:top-2"
                            aria-hidden
                          >
                            <Check className="h-3 w-3 stroke-[3]" />
                          </span>
                        ) : null}
                        <span
                          className={cn(
                            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors sm:h-12 sm:w-12",
                            selected
                              ? "bg-primary/25 text-primary"
                              : "bg-muted/50 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                          )}
                          aria-hidden
                        >
                          <Illustration className="h-6 w-6 sm:h-7 sm:w-7" />
                        </span>
                        <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5">
                          <h3 className="text-xs font-bold leading-tight text-foreground sm:text-sm">
                            {title}
                          </h3>
                          <p className="line-clamp-2 text-[10px] leading-snug text-muted-foreground sm:text-[11px]">
                            {subtitle}
                          </p>
                        </div>
                      </button>
                    )
                  })}
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
                    <Palette className="h-5 w-5" aria-hidden />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <CardTitle className="text-lg text-foreground sm:text-xl lg:text-base">
                      {t("onboarding.appearance.title")}
                    </CardTitle>
                    <CardDescription className="text-sm leading-relaxed lg:text-xs">
                      {t("onboarding.appearance.description")}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain pt-4 pb-4 lg:gap-3 lg:pt-3 lg:pb-4 [scrollbar-gutter:stable]">
                <OnboardingAppearanceStep
                  onBack={() => setStep(0)}
                  onContinue={() => setStep(2)}
                />
              </CardContent>
            </>
          )}

          {step === 2 && (
            <>
              <CardHeader className="space-y-2 border-b border-border/60 bg-muted/20 pb-4 lg:pb-3 lg:pt-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    <User className="h-5 w-5" aria-hidden />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <CardTitle className="text-lg text-foreground sm:text-xl lg:text-base">
                      {t("onboarding.basic.title")}
                    </CardTitle>
                    <CardDescription className="text-sm leading-relaxed lg:text-xs">
                      {t("onboarding.basic.requiredNotePrefix")}
                      <span className="font-medium text-primary">*</span>
                      {t("onboarding.basic.requiredNoteSuffix")}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex min-h-0 flex-1 flex-col gap-0 overflow-y-auto pt-5 lg:pt-4 lg:pb-4">
                <div className="flex flex-col gap-6 lg:gap-5">
                  <div className="flex flex-col items-center gap-2">
                    <button
                      type="button"
                      onClick={() => document.getElementById("onb-photo")?.click()}
                      className="group relative h-24 w-24 overflow-hidden rounded-full border-2 border-dashed border-border bg-muted/30"
                    >
                      {photoPreview ? (
                        <img src={photoPreview} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="flex h-full w-full flex-col items-center justify-center gap-1 text-muted-foreground">
                          <Camera className="h-6 w-6" aria-hidden />
                          <span className="text-[10px] font-medium">{t("onboarding.photo.add")}</span>
                        </span>
                      )}
                      <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                        <Camera className="h-5 w-5 text-white" aria-hidden />
                      </span>
                    </button>
                    <input
                      id="onb-photo"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        handlePhotoPick(e.target.files?.[0] ?? null)
                        e.target.value = ""
                      }}
                    />
                    <p className="text-center text-[11px] text-muted-foreground">
                      {t("onboarding.photo.optional")}
                    </p>
                  </div>

                  {/* Nombre */}
                  <div className="rounded-xl border border-border/60 bg-muted/15 p-4 lg:p-3">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground lg:mb-2">
                      {t("onboarding.basic.sectionPublicName")}
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2 lg:gap-3">
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="onb-nombres" className="text-sm font-medium text-foreground">
                          {t("onboarding.firstName")} <span className="text-primary">*</span>
                        </Label>
                        <Input
                          id="onb-nombres"
                          value={nombres}
                          onChange={(e) => setNombres(e.target.value)}
                          placeholder={t("onboarding.firstName.placeholder")}
                          autoComplete="given-name"
                          autoCapitalize="words"
                          className="h-11 border-border/80 bg-background/80 text-foreground shadow-sm transition-colors placeholder:text-muted-foreground/80 focus-visible:border-primary/50 focus-visible:ring-primary/20 lg:h-10"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="onb-apellidos" className="text-sm font-medium text-foreground">
                          {t("onboarding.lastName")} <span className="text-primary">*</span>
                        </Label>
                        <Input
                          id="onb-apellidos"
                          value={apellidos}
                          onChange={(e) => setApellidos(e.target.value)}
                          placeholder={t("onboarding.lastName.placeholder")}
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
                      {t("onboarding.gender")} <span className="text-primary">*</span>
                    </p>
                    <div
                      className="flex gap-1 rounded-2xl border border-border/70 bg-muted/30 p-1 shadow-inner"
                      role="radiogroup"
                      aria-label={t("onboarding.gender")}
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
                            {s === "MALE" ? t("onboarding.gender.male") : t("onboarding.gender.female")}
                          </button>
                        )
                      })}
                    </div>
                    <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                      {t("onboarding.gender.hint")}
                    </p>
                  </div>

                  {/* Fecha */}
                  <div className="rounded-xl border border-border/60 bg-muted/15 p-4 lg:p-3">
                    <div className="mb-3 flex items-center gap-2 lg:mb-2">
                      <Calendar className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                      <Label
                        htmlFor="onb-dob"
                        className="text-sm font-medium leading-none text-foreground"
                      >
                        {t("onboarding.dob")} <span className="text-primary">*</span>
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
                      <span>{t("onboarding.dob.hint")}</span>
                    </p>
                  </div>

                  {/* Teléfono */}
                  <div className="rounded-xl border border-dashed border-border/80 bg-muted/10 p-4 lg:p-3">
                    <div className="mb-3 flex items-center gap-2 lg:mb-2">
                      <Phone className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                      <Label htmlFor="onb-phone" className="text-sm font-medium text-foreground">
                        {t("onboarding.phone")}
                      </Label>
                      <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        {t("onboarding.optional")}
                      </span>
                    </div>
                    <Input
                      id="onb-phone"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      placeholder={t("onboarding.phone.placeholder")}
                      inputMode="tel"
                      autoComplete="tel"
                      className="h-11 border-border/80 bg-background/80 text-foreground shadow-sm placeholder:text-muted-foreground/70 focus-visible:border-primary/50 focus-visible:ring-primary/20 lg:h-10"
                    />
                    <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                      {t("onboarding.phone.hint")}
                    </p>
                  </div>
                </div>

                <div className="mt-8 flex shrink-0 flex-col-reverse gap-3 border-t border-border/50 pt-5 sm:mt-10 sm:flex-row sm:justify-end lg:mt-8 lg:gap-3 lg:pt-4">
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

          {step === 3 && (
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
                          {t("onboarding.step2.title")}
                        </CardTitle>
                        <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                          {t("onboarding.optional")}
                        </span>
                      </div>
                      <CardDescription className="text-sm leading-relaxed text-muted-foreground lg:text-xs">
                        {t("onboarding.interests.desc")}{" "}
                        <span className="font-medium text-foreground/90">{t("onboarding.interests.skipAny")}</span>
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
                      ? t("onboarding.interests.noneYet")
                      : `${selectedInterests.length} ${
                          selectedInterests.length === 1
                            ? t("onboarding.interests.selectedOne")
                            : t("onboarding.interests.selectedMany")
                        }`}
                  </div>
                </div>
                <p className="text-[11px] leading-relaxed text-muted-foreground sm:pl-[3.25rem] lg:text-[10px]">
                  {t("onboarding.interests.tip")}
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
                            {categoryLabel(category)}
                          </h3>
                          <p className="text-[11px] text-muted-foreground">{t("onboarding.interests.tapHint")}</p>
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
                        {t("onboarding.interests.empty")}
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex shrink-0 flex-col-reverse gap-3 border-t border-border/50 pt-5 sm:mt-5 sm:flex-row sm:justify-end lg:gap-3 lg:pt-4">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setStep(2)}
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

          {step === 4 && (
            <>
              <CardHeader className="space-y-1 border-b border-border/60 bg-muted/20 pb-4 lg:pb-3 lg:pt-4">
                <CardTitle className="text-lg text-foreground sm:text-xl lg:text-base">{t("onboarding.step3.title")}</CardTitle>
                <CardDescription className="text-sm lg:text-xs">
                  {t("onboarding.prefs.desc")}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto pt-6 lg:gap-4 lg:pt-4 lg:pb-4">
                <div className="flex flex-col gap-3 lg:gap-2">
                  <span className="text-sm font-medium text-foreground lg:text-xs">{t("onboarding.prefs.meet")}</span>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        { value: "MALE" as const, label: t("onboarding.prefs.men") },
                        { value: "FEMALE" as const, label: t("onboarding.prefs.women") },
                        { value: "BOTH" as const, label: t("onboarding.prefs.everyone") },
                      ] as const
                    ).map(({ value, label }) => (
                      <Button
                        key={value}
                        type="button"
                        variant={interestedIn === value ? "default" : "outline"}
                        onClick={() => setInterestedIn(value)}
                        className={cn(
                          "h-11 rounded-xl px-2 text-xs sm:text-sm lg:h-9",
                          interestedIn === value
                            ? "bg-primary text-primary-foreground shadow-md"
                            : "border-border text-foreground hover:bg-muted"
                        )}
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-border/60 bg-muted/30 p-4 lg:p-3">
                  <div className="mb-3 flex items-center justify-between gap-2 lg:mb-2">
                    <span className="text-sm font-medium text-foreground lg:text-xs">{t("onboarding.prefs.ageRange")}</span>
                    <span className="rounded-md bg-background/80 px-2 py-1 font-mono text-sm tabular-nums text-primary">
                      {ageRange[0]} – {ageRange[1]} {t("onboarding.prefs.years")}
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
                    {t("onboarding.prefs.sliderHint")}
                  </p>
                </div>

                <div className="flex flex-col gap-2 rounded-xl border border-border/60 bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between lg:gap-3 lg:p-3">
                  <div className="space-y-0.5">
                    <Label htmlFor="onb-showme" className="text-foreground cursor-pointer text-base">
                      {t("onboarding.prefs.showInSearch")}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {t("onboarding.prefs.showInSearchHint")}
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
                    onClick={() => setStep(3)}
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
                    {t("onboarding.enter")}
                  </Button>
                </div>
              </CardContent>
            </>
          )}
        </Card>

        <p className="mt-4 shrink-0 text-center text-xs text-muted-foreground lg:mt-2 lg:text-[10px]">
          {t("onboarding.footer.confirm")}
        </p>
      </div>
    </SparkBackground>
  )
}
