"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { api, ApiError } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import type {
  AccountType,
  Interest,
  Sex,
  UpdateProfileRequest,
  UserPreferences,
} from "@/lib/types"
import { profileService } from "@/lib/services/profile"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import {
  Loader2,
  SlidersHorizontal,
  Star,
  Trash2,
  LogOut,
  Check,
  X,
  Bell,
  Key,
  Mail,
} from "lucide-react"
import { usePushNotifications } from "@/hooks/use-push-notifications"
import { privacyService } from "@/lib/services/privacy"
import { authService } from "@/lib/services/auth"
import { normalizeEmailValue } from "@/lib/email-utils"
import type { PrivacySettings, SparklingListMember } from "@/lib/types"
import { Shield, Users } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

/** Valores UI de la sección Experiencia (Ajustes). */
type ExperienceObjective = "social" | "connection" | "both"

/** Alineado con enum backend: SOCIAL | DATING | BOTH. */
function experienceObjectiveToAccountType(
  objective: ExperienceObjective
): AccountType {
  if (objective === "social") return "SOCIAL"
  if (objective === "connection") return "DATING"
  return "BOTH"
}

/** Estado inicial del selector a partir del perfil y ajustes locales. */
function objectiveFromAccountTypeAndLocal(
  accountType: string | undefined,
  localObjective: string | undefined
): ExperienceObjective {
  const at = String(accountType ?? "").toUpperCase()
  if (at === "SOCIAL" || at === "FREE") return "social"
  if (at === "DATING") {
    if (localObjective === "connection" || localObjective === "both") {
      return localObjective
    }
    return "both"
  }
  if (at === "BOTH" || at === "PREMIUM") {
    if (localObjective === "connection" || localObjective === "both") {
      return localObjective
    }
    return "both"
  }
  return "social"
}

export default function SettingsPage() {
  const { user, logout, refreshProfile } = useAuth()
  const router = useRouter()
  const { permission, requestPermission, isSupported } = usePushNotifications()

  // Preferences
  const [preferences, setPreferences] = useState<UserPreferences | null>(null)
  const [interestedIn, setInterestedIn] = useState<Sex>("FEMALE")
  const [ageRange, setAgeRange] = useState([18, 35])
  const [showMe, setShowMe] = useState(true)
  const [isPrivate, setIsPrivate] = useState(false)
  const [connectionMode, setConnectionMode] = useState(true)
  const [objective, setObjective] = useState<ExperienceObjective>("both")
  const [localFeedRadius, setLocalFeedRadius] = useState(50) // Radio en km para feed local
  const [prefLoading, setPrefLoading] = useState(true)
  const [savingPref, setSavingPref] = useState(false)
  const [savingExperience, setSavingExperience] = useState(false)

  // Privacy Settings
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    whoCanSeeMyPosts: 'EVERYONE',
    whoCanComment: 'EVERYONE',
    whoCanSendDM: 'EVERYONE',
    showOnlineStatus: true,
    showLastSeen: true,
  })
  const [privacyLoading, setPrivacyLoading] = useState(true)
  const [savingPrivacy, setSavingPrivacy] = useState(false)
  const [sparklingList, setSparklingList] = useState<SparklingListMember[]>([])
  const [sparklingLoading, setSparklingLoading] = useState(false)

  const PENDING_EMAIL_CHANGE_KEY = "sparkd_pending_email_change_v1"

  // Change email
  const [showChangeEmail, setShowChangeEmail] = useState(false)
  const [newEmail, setNewEmail] = useState("")
  const [confirmNewEmail, setConfirmNewEmail] = useState("")
  const [changingEmail, setChangingEmail] = useState(false)
  const [emailChangeCodePending, setEmailChangeCodePending] = useState(false)
  const [emailChangeCode, setEmailChangeCode] = useState("")
  const [verifyingEmailCode, setVerifyingEmailCode] = useState(false)

  // Change Password
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmNewPassword, setConfirmNewPassword] = useState("")
  const [changingPassword, setChangingPassword] = useState(false)

  // Interests
  const [allInterests, setAllInterests] = useState<Interest[]>([])
  const [myInterests, setMyInterests] = useState<Interest[]>([])
  const [interestsLoading, setInterestsLoading] = useState(true)

  useEffect(() => {
    if (typeof window === "undefined") return
    if (localStorage.getItem(PENDING_EMAIL_CHANGE_KEY) === "1") {
      setEmailChangeCodePending(true)
    }
  }, [])

  const fetchPreferences = useCallback(async () => {
    try {
      const data = await api.get<UserPreferences>(
        "/api/preferences/get/my/preferences"
      )
      setPreferences(data)
      setInterestedIn(data.interestedIn)
      setAgeRange([data.minAge, data.maxAge])
      setShowMe(data.showMe)
    } catch {
      // silent
    } finally {
      setPrefLoading(false)
    }
  }, [])

  const fetchInterests = useCallback(async () => {
    try {
      const [all, mine] = await Promise.all([
        api.get<Interest[]>("/api/interests/all/interest"),
        api.get<Interest[]>("/api/interests/me"),
      ])
      
      // Si el backend devuelve datos, usarlos
      if (all && all.length > 0) {
        setAllInterests(all)
        setMyInterests(mine || [])
      } else {
        // Si no hay datos, usar fallback
        throw new Error('No interests from backend')
      }
    } catch {
      // Fallback: usar intereses locales si el backend no responde
      const defaultInterests: Interest[] = [
        { interestId: '550e8400-e29b-41d4-a716-446655440001', name: 'Deportes', icon: '⚽', category: 'lifestyle' },
        { interestId: '550e8400-e29b-41d4-a716-446655440002', name: 'Música', icon: '🎵', category: 'entertainment' },
        { interestId: '550e8400-e29b-41d4-a716-446655440003', name: 'Cine', icon: '🎬', category: 'entertainment' },
        { interestId: '550e8400-e29b-41d4-a716-446655440004', name: 'Viajes', icon: '✈️', category: 'lifestyle' },
        { interestId: '550e8400-e29b-41d4-a716-446655440005', name: 'Tecnología', icon: '💻', category: 'hobbies' },
        { interestId: '550e8400-e29b-41d4-a716-446655440006', name: 'Arte', icon: '🎨', category: 'hobbies' },
        { interestId: '550e8400-e29b-41d4-a716-446655440007', name: 'Lectura', icon: '📚', category: 'hobbies' },
        { interestId: '550e8400-e29b-41d4-a716-446655440008', name: 'Cocina', icon: '🍳', category: 'lifestyle' },
        { interestId: '550e8400-e29b-41d4-a716-446655440009', name: 'Fitness', icon: '💪', category: 'lifestyle' },
        { interestId: '550e8400-e29b-41d4-a716-44665544000a', name: 'Gaming', icon: '🎮', category: 'entertainment' },
        { interestId: '550e8400-e29b-41d4-a716-44665544000b', name: 'Fotografía', icon: '📷', category: 'hobbies' },
        { interestId: '550e8400-e29b-41d4-a716-44665544000c', name: 'Naturaleza', icon: '🌿', category: 'lifestyle' },
      ]
      setAllInterests(defaultInterests)
      
      // Cargar intereses guardados localmente
      if (user?.userId) {
        const saved = localStorage.getItem(`sparkd_interests_${user.userId}`)
        if (saved) {
          setMyInterests(JSON.parse(saved))
        }
      }
    } finally {
      setInterestsLoading(false)
    }
  }, [user])

  const fetchPrivacySettings = useCallback(async () => {
    try {
      const data = await privacyService.getSettings()
      setPrivacySettings(data)
    } catch {
      // silent - usar defaults
    } finally {
      setPrivacyLoading(false)
    }
  }, [])

  const fetchSparklingList = useCallback(async () => {
    setSparklingLoading(true)
    try {
      const data = await privacyService.getSparklingList()
      setSparklingList(data)
    } catch {
      // silent
    } finally {
      setSparklingLoading(false)
    }
  }, [])

  const savePrivacySettings = async () => {
    setSavingPrivacy(true)
    try {
      await privacyService.updateSettings(privacySettings)
      toast.success("Privacidad actualizada")
    } catch {
      toast.error("Error al guardar privacidad")
    } finally {
      setSavingPrivacy(false)
    }
  }

  const handleRemoveFromSparklingList = async (memberId: string) => {
    try {
      await privacyService.removeFromSparklingList(memberId)
      setSparklingList(prev => prev.filter(m => m.userId !== memberId))
      toast.success("Eliminado de Sparkling List")
    } catch {
      toast.error("Error al eliminar")
    }
  }

  useEffect(() => {
    fetchPreferences()
    fetchInterests()
    fetchPrivacySettings()
  }, [fetchPreferences, fetchInterests, fetchPrivacySettings])

  useEffect(() => {
    if (!user?.userId) return
    const saved = localStorage.getItem(`sparkd_settings_${user.userId}`)
    const settings = saved ? JSON.parse(saved) : {}
    setIsPrivate(settings.isPrivate ?? false)
    setConnectionMode(settings.connectionMode ?? true)
    setLocalFeedRadius(settings.localFeedRadius ?? 50)
    setObjective(
      objectiveFromAccountTypeAndLocal(
        user.accountType,
        settings.objective
      )
    )
  }, [user?.userId, user?.accountType])

  const saveExperience = async () => {
    if (!user) {
      toast.error("Inicia sesión para guardar")
      return
    }
    if (!(user.username ?? "").trim()) {
      toast.error(
        "Añade un nombre de usuario en Editar perfil antes de guardar la experiencia."
      )
      return
    }
    setSavingExperience(true)
    try {
      const nextAccountType = experienceObjectiveToAccountType(objective)
      const body: UpdateProfileRequest = {
        nombres: user.nombres,
        apellidos: user.apellidos,
        username: (user.username ?? "").trim(),
        accountType: nextAccountType,
        sex: user.sex,
        dateOfBirth: user.dateOfBirth,
        telefono: user.telefono || "",
        bio: user.bio ?? null,
        url: user.url ?? user.website ?? null,
        visibility: user.visibility,
        showPremiumBadge: user.showPremiumBadge,
      }
      if (user.latitude != null && user.longitude != null) {
        body.latitude = user.latitude
        body.longitude = user.longitude
      }
      if (user.location) body.location = user.location

      await profileService.updateMyProfile(body)
      await refreshProfile()

      const key = `sparkd_settings_${user.userId}`
      const prev = localStorage.getItem(key)
      const rest = prev ? JSON.parse(prev) : {}
      localStorage.setItem(
        key,
        JSON.stringify({
          ...rest,
          isPrivate,
          connectionMode,
          objective,
          localFeedRadius,
        })
      )

      toast.success("Experiencia guardada")
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message)
      } else {
        toast.error(
          err instanceof Error ? err.message : "Error al guardar experiencia"
        )
      }
    } finally {
      setSavingExperience(false)
    }
  }

  const savePreferences = async () => {
    setSavingPref(true)
    try {
      await api.post("/api/preferences/set/preferences", {
        interestedIn,
        minAge: ageRange[0],
        maxAge: ageRange[1],
        showMe,
      })
      
      // Guardar configuraciones localmente
      if (user?.userId) {
        localStorage.setItem(`sparkd_settings_${user.userId}`, JSON.stringify({
          isPrivate,
          connectionMode,
          objective,
          localFeedRadius
        }))
      }
      
      toast.success("Preferencias guardadas")
    } catch {
      toast.error("Error al guardar")
    } finally {
      setSavingPref(false)
    }
  }

  const toggleInterest = async (interestId: string) => {
    const isSelected = myInterests.some((i) => i.interestId === interestId)
    const interest = allInterests.find((i) => i.interestId === interestId)
    if (!interest) return

    try {
      if (isSelected) {
        await api.delete(`/api/interests/remove/${interestId}`)
        toast.success("Interés eliminado")
      } else {
        await api.post(`/api/interests/add/${interestId}`)
        toast.success("Interés agregado")
      }
      fetchInterests()
      await refreshProfile()
    } catch {
      // Fallback: guardar localmente
      let updated: Interest[]
      if (isSelected) {
        updated = myInterests.filter((i) => i.interestId !== interestId)
        toast.success("Interés eliminado")
      } else {
        updated = [...myInterests, interest]
        toast.success("Interés agregado")
      }
      setMyInterests(updated)
      
      // Guardar en localStorage
      if (user?.userId) {
        localStorage.setItem(`sparkd_interests_${user.userId}`, JSON.stringify(updated))
        
        // Actualizar el perfil del usuario localmente
        const savedUser = localStorage.getItem('sparkd_user')
        if (savedUser) {
          const userObj = JSON.parse(savedUser)
          userObj.interests = updated.map(i => i.name)
          localStorage.setItem('sparkd_user', JSON.stringify(userObj))
          await refreshProfile()
        }
      }
    }
  }

  const handleChangeEmail = async () => {
    if (!newEmail.trim() || !confirmNewEmail.trim()) {
      toast.error("Escribe y confirma el nuevo correo")
      return
    }
    const next = normalizeEmailValue(newEmail)
    const again = normalizeEmailValue(confirmNewEmail)
    if (next !== again) {
      toast.error("Los correos no coinciden. Revisa mayúsculas, espacios o copia el mismo texto en ambos campos.")
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(next)) {
      toast.error("Ingresa un correo válido")
      return
    }
    const current = (user?.email || "").trim().toLowerCase()
    if (current && next === current) {
      toast.error("El nuevo correo es igual al actual")
      return
    }
    setChangingEmail(true)
    try {
      await authService.requestEmailChange(next)
      localStorage.setItem(PENDING_EMAIL_CHANGE_KEY, "1")
      setEmailChangeCodePending(true)
      setEmailChangeCode("")
      toast.success(
        "Código enviado al nuevo correo. Baja un poco e introdúcelo en el campo de verificación de esta misma pantalla (Configuración → Cuenta)."
      )
      setShowChangeEmail(false)
      setNewEmail("")
      setConfirmNewEmail("")
      await refreshProfile()
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Error al solicitar el cambio de correo"
      )
    } finally {
      setChangingEmail(false)
    }
  }

  const clearEmailChangePending = () => {
    localStorage.removeItem(PENDING_EMAIL_CHANGE_KEY)
    setEmailChangeCodePending(false)
    setEmailChangeCode("")
  }

  const handleVerifyEmailCode = async () => {
    const c = emailChangeCode.trim()
    if (!c) {
      toast.error("Escribe el código que recibiste")
      return
    }
    setVerifyingEmailCode(true)
    try {
      await authService.verifyEmailChange(c)
      clearEmailChangePending()
      await refreshProfile()
      toast.success("Correo actualizado correctamente")
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Código incorrecto o expirado"
      )
    } finally {
      setVerifyingEmailCode(false)
    }
  }

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      toast.error("Completa todos los campos")
      return
    }
    if (newPassword.length < 6) {
      toast.error("La nueva contraseña debe tener al menos 6 caracteres")
      return
    }
    if (newPassword !== confirmNewPassword) {
      toast.error("Las contraseñas no coinciden")
      return
    }
    setChangingPassword(true)
    try {
      await authService.changePassword({
        currentPassword,
        newPassword,
      })
      toast.success("Contraseña actualizada")
      setShowChangePassword(false)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmNewPassword("")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al cambiar contraseña")
    } finally {
      setChangingPassword(false)
    }
  }

  const handleDeleteProfile = async () => {
    try {
      await api.delete("/api/profile")
      toast.success("Perfil eliminado")
      logout()
    } catch {
      toast.error("Error al eliminar perfil")
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="mb-6 text-xl font-bold text-foreground">Configuracion</h1>

      {/* Privacy Settings - Backend */}
      <Card className="border-border bg-card mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground text-base">
            <Shield className="h-4 w-4" />
            Privacidad
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {privacyLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-foreground font-medium">¿Quién puede ver mis posts?</Label>
                </div>
                <Select
                  value={privacySettings.whoCanSeeMyPosts}
                  onValueChange={(v) => setPrivacySettings(p => ({ ...p, whoCanSeeMyPosts: v as any }))}
                >
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EVERYONE">Todos</SelectItem>
                    <SelectItem value="FOLLOWERS">Seguidores</SelectItem>
                    <SelectItem value="NOBODY">Nadie</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-foreground font-medium">¿Quién puede comentar?</Label>
                </div>
                <Select
                  value={privacySettings.whoCanComment}
                  onValueChange={(v) => setPrivacySettings(p => ({ ...p, whoCanComment: v as any }))}
                >
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EVERYONE">Todos</SelectItem>
                    <SelectItem value="FOLLOWERS">Seguidores</SelectItem>
                    <SelectItem value="NOBODY">Nadie</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-foreground font-medium">¿Quién puede enviarme DMs?</Label>
                </div>
                <Select
                  value={privacySettings.whoCanSendDM}
                  onValueChange={(v) => setPrivacySettings(p => ({ ...p, whoCanSendDM: v as any }))}
                >
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EVERYONE">Todos</SelectItem>
                    <SelectItem value="FOLLOWERS">Seguidores</SelectItem>
                    <SelectItem value="MATCHES">Matches</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg border border-primary/30 bg-card">
                <div>
                  <Label className="text-foreground font-medium">Mostrar estado en línea</Label>
                  <p className="text-xs text-muted-foreground mt-1">Otros pueden ver cuando estás activo</p>
                </div>
                <Switch
                  checked={privacySettings.showOnlineStatus}
                  onCheckedChange={(v) => setPrivacySettings(p => ({ ...p, showOnlineStatus: v }))}
                />
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg border border-primary/30 bg-card">
                <div>
                  <Label className="text-foreground font-medium">Mostrar última vez visto</Label>
                  <p className="text-xs text-muted-foreground mt-1">Otros pueden ver cuándo estuviste activo</p>
                </div>
                <Switch
                  checked={privacySettings.showLastSeen}
                  onCheckedChange={(v) => setPrivacySettings(p => ({ ...p, showLastSeen: v }))}
                />
              </div>
              <Button
                onClick={savePrivacySettings}
                disabled={savingPrivacy}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {savingPrivacy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                Guardar privacidad
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Sparkling List */}
      <Card className="border-border bg-card mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-foreground text-base">
            <span className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Sparkling List
            </span>
            <Button size="sm" variant="outline" onClick={fetchSparklingList} disabled={sparklingLoading}>
              {sparklingLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Ver lista"}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sparklingList.length === 0 ? (
            <p className="text-sm text-muted-foreground">Tu lista especial de contactos está vacía. Puedes agregar personas desde su perfil.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {sparklingList.map((member) => (
                <div key={member.userId} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                      {member.username?.[0]?.toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-foreground">{member.username}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveFromSparklingList(member.userId)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Privacy & Mode */}
      <Card className="border-border bg-card mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground text-base">
            <SlidersHorizontal className="h-4 w-4" />
            Privacidad y Modo
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {isSupported && (
            <div className="flex items-center justify-between p-4 rounded-lg border border-primary/30 bg-card">
              <div className="flex-1">
                <Label className="text-foreground font-medium flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Notificaciones Push
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  {permission === 'granted' ? 'Activadas' : permission === 'denied' ? 'Bloqueadas' : 'Desactivadas'}
                </p>
              </div>
              {permission !== 'granted' && (
                <Button
                  size="sm"
                  onClick={requestPermission}
                  className="bg-primary text-primary-foreground"
                >
                  Activar
                </Button>
              )}
              {permission === 'granted' && (
                <Check className="h-5 w-5 text-success" />
              )}
            </div>
          )}
          <div className="flex items-center justify-between p-4 rounded-lg border border-primary/30 bg-card">
            <div className="flex-1">
              <Label className="text-foreground font-medium">Perfil Privado</Label>
              <p className="text-xs text-muted-foreground mt-1">Solo seguidores ven tus posts</p>
            </div>
            <Switch checked={isPrivate} onCheckedChange={setIsPrivate} />
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg border border-primary/30 bg-card">
            <div className="flex-1">
              <Label className="text-foreground font-medium">Modo Conexión</Label>
              <p className="text-xs text-muted-foreground mt-1">Aparecer en sugerencias de matching</p>
            </div>
            <Switch checked={connectionMode} onCheckedChange={setConnectionMode} />
          </div>
          <div className="p-4 rounded-lg border border-primary/30 bg-card">
            <Label className="text-foreground font-medium mb-3 block">Experiencia</Label>
            <div className="flex flex-col gap-2">
              {(
                [
                  { id: "social" as const, label: "🤝 Social", desc: "Solo red social" },
                  { id: "connection" as const, label: "💫 Conexión", desc: "Solo dating/matching" },
                  { id: "both" as const, label: "⚡ Ambos", desc: "Experiencia completa" },
                ] as const
              ).map((exp) => (
                <button
                  key={exp.id}
                  type="button"
                  disabled={savingExperience}
                  onClick={() => setObjective(exp.id)}
                  className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                    objective === exp.id
                      ? "bg-primary/10 border border-primary"
                      : "bg-muted border border-transparent hover:bg-muted/80"
                  }`}
                >
                  <div className="text-left">
                    <p className="text-sm font-medium text-foreground">{exp.label}</p>
                    <p className="text-xs text-muted-foreground">{exp.desc}</p>
                  </div>
                  {objective === exp.id && <Check className="h-4 w-4 text-primary" />}
                </button>
              ))}
            </div>
            <Button
              type="button"
              onClick={saveExperience}
              disabled={savingExperience || !user}
              className="mt-3 w-full bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto"
            >
              {savingExperience ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              Guardar experiencia
            </Button>
          </div>
          <div className="p-4 rounded-lg border border-primary/30 bg-card">
            <Label className="text-foreground font-medium mb-3 block">Radio de Feed Local</Label>
            <p className="text-xs text-muted-foreground mb-4">
              Distancia máxima para ver posts cercanos: {localFeedRadius} km
            </p>
            <Slider
              value={[localFeedRadius]}
              onValueChange={(value) => setLocalFeedRadius(value[0])}
              min={5}
              max={200}
              step={5}
              className="mb-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>5 km</span>
              <span>200 km</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card className="border-border bg-card mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground text-base">
            <SlidersHorizontal className="h-4 w-4" />
            Preferencias de busqueda
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {prefLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-2">
                <Label className="text-foreground">Me interesa</Label>
                <div className="flex gap-2">
                  {(["MALE", "FEMALE"] as Sex[]).map((s) => (
                    <Button
                      key={s}
                      type="button"
                      variant={interestedIn === s ? "default" : "outline"}
                      onClick={() => setInterestedIn(s)}
                      className={
                        interestedIn === s
                          ? "bg-primary text-primary-foreground"
                          : "border-border text-foreground hover:bg-muted"
                      }
                    >
                      {s === "MALE" ? "Hombres" : "Mujeres"}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <Label className="text-foreground">
                  Rango de edad: {ageRange[0]} - {ageRange[1]}
                </Label>
                <Slider
                  value={ageRange}
                  onValueChange={setAgeRange}
                  min={18}
                  max={60}
                  step={1}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-foreground">
                  Mostrarme en busquedas
                </Label>
                <Switch checked={showMe} onCheckedChange={setShowMe} />
              </div>
              <Button
                onClick={savePreferences}
                disabled={savingPref}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {savingPref ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
                Guardar preferencias
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Interests */}
      <Card className="border-border bg-card mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground text-base">
            <Star className="h-4 w-4" />
            Mis intereses
          </CardTitle>
        </CardHeader>
        <CardContent>
          {interestsLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (() => {
            const categoryNames: Record<string, string> = {
              ENTRETENIMIENTO: "🎬 Entretenimiento",
              DEPORTE: "⚽ Deporte",
              VIAJES: "✈️ Viajes",
              ESTILO_DE_VIDA: "💎 Estilo de Vida",
              CONOCIMIENTO: "📚 Conocimiento",
              SOCIAL: "👥 Social",
              ARTE: "🎨 Arte",
              MUSICA: "🎵 Música",
              GASTRONOMIA: "🍽️ Gastronomía",
              NATURALEZA: "🌿 Naturaleza",
              TECNOLOGIA: "💻 Tecnología",
              NEGOCIOS: "💼 Negocios",
              BIENESTAR: "🧘 Bienestar",
              CULTURA: "🏛️ Cultura",
              AVENTURA: "🏔️ Aventura"
            }

            const categories = [...new Set(allInterests.map((i) => i.category))]

            return (
              <div className="space-y-6">
                {categories.map((category) => (
                  <div key={category}>
                    <p className="mb-3 text-sm font-bold text-foreground">
                      {categoryNames[category] || category}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {allInterests
                        .filter((i) => i.category === category)
                        .map((interest) => {
                          const isSelected = myInterests.some(
                            (i) => i.interestId === interest.interestId
                          )
                          return (
                            <button
                              key={interest.interestId}
                              onClick={() => toggleInterest(interest.interestId)}
                              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
                                isSelected
                                  ? "bg-gradient-to-r from-primary to-secondary text-black shadow-lg scale-105"
                                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:scale-105"
                              }`}
                            >
                              {interest.icon && <span>{interest.icon}</span>}
                              {interest.name}
                              {isSelected && <Check className="h-3 w-3" />}
                            </button>
                          )
                        })}
                    </div>
                  </div>
                ))}
                {allInterests.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No hay intereses disponibles
                  </p>
                )}
              </div>
            )
          })()}
        </CardContent>
      </Card>

      {/* Account actions */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground text-base">Cuenta</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-3">
            <div className="flex items-center gap-2 text-foreground">
              <Mail className="h-4 w-4 shrink-0" />
              <span className="text-sm font-semibold">Cambiar correo</span>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground text-sm">Correo actual</Label>
              <Input
                readOnly
                value={user?.email?.trim() ?? ""}
                placeholder="No figura en tu perfil"
                className="bg-muted/50 border-border text-foreground"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowChangeEmail((v) => !v)
                setNewEmail("")
                setConfirmNewEmail("")
              }}
              className="w-full justify-start border-border text-foreground hover:bg-muted"
            >
              <Mail className="mr-2 h-4 w-4" />
              {showChangeEmail ? "Ocultar formulario" : "Actualizar correo electrónico"}
            </Button>
            {showChangeEmail && (
              <div className="space-y-3 pt-1 border-t border-border">
                <div className="flex flex-col gap-2">
                  <Label className="text-foreground text-sm">Nuevo correo</Label>
                  <Input
                    type="email"
                    autoComplete="off"
                    name="new-email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    onBlur={() => setNewEmail((s) => s.trim())}
                    placeholder="nuevo@correo.com"
                    className="bg-background border-border"
                    disabled={changingEmail}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-foreground text-sm">Confirmar nuevo correo</Label>
                  <Input
                    type="email"
                    autoComplete="off"
                    name="confirm-new-email"
                    value={confirmNewEmail}
                    onChange={(e) => setConfirmNewEmail(e.target.value)}
                    onBlur={() => setConfirmNewEmail((s) => s.trim())}
                    placeholder="Vuelve a escribir el mismo correo"
                    className="bg-background border-border"
                    disabled={changingEmail}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Te enviaremos un código al nuevo correo para que confirmes el cambio.
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={handleChangeEmail}
                    disabled={changingEmail}
                    className="flex-1 bg-primary text-primary-foreground"
                  >
                    {changingEmail ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Guardar nuevo correo"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowChangeEmail(false)
                      setNewEmail("")
                      setConfirmNewEmail("")
                    }}
                    disabled={changingEmail}
                    className="border-border"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}

            {emailChangeCodePending && (
              <div className="space-y-2 border-t border-border pt-3 mt-1">
                <div className="flex items-center gap-2 text-foreground">
                  <Check className="h-4 w-4 shrink-0" />
                  <span className="text-sm font-semibold">Paso 2: confirmar con el código</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  En el <strong>correo nuevo</strong> (revisa spam) te enviamos un código. Cópialo aquí y pulsa
                  confirmar. Es en esta misma página, sección Cuenta.
                </p>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                  <div className="flex-1">
                    <Label className="text-foreground text-sm">Código de verificación</Label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      name="email-change-code"
                      value={emailChangeCode}
                      onChange={(e) => setEmailChangeCode(e.target.value.replace(/\s/g, ""))}
                      placeholder="P.ej. 123456"
                      className="bg-background border-border"
                      disabled={verifyingEmailCode}
                    />
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      type="button"
                      onClick={handleVerifyEmailCode}
                      disabled={verifyingEmailCode}
                      className="bg-primary text-primary-foreground"
                    >
                      {verifyingEmailCode ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Confirmar correo"
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={clearEmailChangePending}
                      disabled={verifyingEmailCode}
                      className="text-muted-foreground"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Button
            variant="outline"
            onClick={() => setShowChangePassword(!showChangePassword)}
            className="justify-start border-border text-foreground hover:bg-muted"
          >
            <Key className="mr-2 h-4 w-4" />
            Cambiar contraseña
          </Button>
          
          {showChangePassword && (
            <div className="p-4 rounded-lg border border-border bg-muted/30 space-y-3">
              <div className="flex flex-col gap-2">
                <Label className="text-foreground text-sm">Contraseña actual</Label>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="bg-background border-border"
                  disabled={changingPassword}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label className="text-foreground text-sm">Nueva contraseña</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="bg-background border-border"
                  disabled={changingPassword}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label className="text-foreground text-sm">Confirmar nueva contraseña</Label>
                <Input
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="bg-background border-border"
                  disabled={changingPassword}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleChangePassword}
                  disabled={changingPassword}
                  className="flex-1 bg-primary text-primary-foreground"
                >
                  {changingPassword ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Actualizar"
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowChangePassword(false)
                    setCurrentPassword("")
                    setNewPassword("")
                    setConfirmNewPassword("")
                  }}
                  disabled={changingPassword}
                  className="border-border"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
          
          <Button
            variant="outline"
            onClick={logout}
            className="justify-start border-border text-foreground hover:bg-muted"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar sesion
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="justify-start border-destructive/30 text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar perfil
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-card border-border">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-foreground">
                  Eliminar perfil?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-muted-foreground">
                  Esta accion no se puede deshacer. Se eliminara tu perfil y
                  todos tus datos permanentemente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="border-border text-foreground">
                  Cancelar
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteProfile}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  )
}
