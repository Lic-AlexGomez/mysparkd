"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { api, ApiError } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import type {
  AccountType,
  Interest,
  Sex,
  InterestedIn,
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
  Shield,
  Ban,
  Users,
  Layout,
} from "lucide-react"
import { NavbarStylePicker } from "@/components/settings/navbar-style-picker"
import { usePushNotifications } from "@/hooks/use-push-notifications"
import { usePremiumStatus } from "@/hooks/use-premium-status"
import { useFeedLocation } from "@/hooks/use-feed-location"
import { VirtualLocationCard } from "@/components/settings/virtual-location-card"
import { privacyService } from "@/lib/services/privacy"
import { blockService } from "@/lib/services/block"
import { authService } from "@/lib/services/auth"
import { PasskeysSection } from "@/components/settings/passkeys-section"
import { normalizeEmailValue } from "@/lib/email-utils"
import type { PrivacySettings, SparklingListMember } from "@/lib/types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useI18n } from "@/lib/i18n"

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
  const { te, t } = useI18n()
  const { user, logout, refreshProfile } = useAuth()
  const router = useRouter()
  const { permission, requestPermission, isSupported } = usePushNotifications()
  const { isPremium } = usePremiumStatus()
  const feedLocation = useFeedLocation()

  // Preferences
  const [preferences, setPreferences] = useState<UserPreferences | null>(null)
  const [interestedIn, setInterestedIn] = useState<InterestedIn>("FEMALE")
  const [ageRange, setAgeRange] = useState([18, 35])
  const [showMe, setShowMe] = useState(true)
  const [isPrivate, setIsPrivate] = useState(false)
  const [connectionMode, setConnectionMode] = useState(true)
  const [objective, setObjective] = useState<ExperienceObjective>("both")
  const [localFeedRadius, setLocalFeedRadius] = useState(50) // Radio en km para feed local
  const [prefLoading, setPrefLoading] = useState(true)
  const [savingPref, setSavingPref] = useState(false)
  const [savingExperience, setSavingExperience] = useState(false)
  const [showExperienceConfirm, setShowExperienceConfirm] = useState(false)

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
  const [blockedUsers, setBlockedUsers] = useState<Array<{ userId: string; username?: string; nombres?: string }>>([])
  const [blockedLoading, setBlockedLoading] = useState(true)
  const [unblockingId, setUnblockingId] = useState<string | null>(null)

  const PENDING_EMAIL_CHANGE_KEY = "sparkd_pending_email_change_v1"
  const PENDING_RECOVERY_KEY = "sparkd_pending_recovery_email_v1"

  // Change email
  const [showChangeEmail, setShowChangeEmail] = useState(false)
  const [newEmail, setNewEmail] = useState("")
  const [confirmNewEmail, setConfirmNewEmail] = useState("")
  const [changingEmail, setChangingEmail] = useState(false)
  const [emailChangeCodePending, setEmailChangeCodePending] = useState(false)
  const [emailChangeCode, setEmailChangeCode] = useState("")
  const [verifyingEmailCode, setVerifyingEmailCode] = useState(false)

  // Recovery email (secundario)
  const [showRecoveryForm, setShowRecoveryForm] = useState(false)
  const [newRecoveryEmail, setNewRecoveryEmail] = useState("")
  const [confirmRecoveryEmail, setConfirmRecoveryEmail] = useState("")
  const [changingRecovery, setChangingRecovery] = useState(false)
  const [recoveryCodePending, setRecoveryCodePending] = useState(false)
  /** Si aún no está en el perfil, el correo al que se envió el código (guardado en localStorage). */
  const [pendingRecoveryTargetEmail, setPendingRecoveryTargetEmail] = useState("")
  const [recoveryCode, setRecoveryCode] = useState("")
  const [verifyingRecoveryCode, setVerifyingRecoveryCode] = useState(false)
  const [deletingRecovery, setDeletingRecovery] = useState(false)
  const [promotingPrimary, setPromotingPrimary] = useState(false)

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
    const rawRec = localStorage.getItem(PENDING_RECOVERY_KEY)
    if (rawRec) {
      setRecoveryCodePending(true)
      if (rawRec.includes("@")) {
        setPendingRecoveryTargetEmail(rawRec.trim().toLowerCase())
      }
    }
  }, [])

  const fetchPreferences = useCallback(async () => {
    try {
      const data = await api.get<UserPreferences>(
        "/api/preferences/get/my/preferences"
      )
      setPreferences(data)
      const pref =
        data.interestedIn === "MALE" ||
        data.interestedIn === "FEMALE" ||
        data.interestedIn === "BOTH"
          ? data.interestedIn
          : "FEMALE"
      setInterestedIn(pref)
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

  const fetchBlockedUsers = useCallback(async () => {
    if (!user?.userId) {
      setBlockedLoading(false)
      return
    }
    setBlockedLoading(true)
    try {
      const ids = await blockService.listBlockedUserIds(user.userId)
      if (!ids.length) {
        setBlockedUsers([])
        return
      }
      const rows = await Promise.all(
        ids.map(async (id) => {
          try {
            const p = await profileService.getProfile(id)
            return { userId: id, username: p.username, nombres: p.nombres }
          } catch {
            return { userId: id }
          }
        })
      )
      setBlockedUsers(rows)
    } catch {
      setBlockedUsers([])
    } finally {
      setBlockedLoading(false)
    }
  }, [user?.userId])

  const handleUnblockUser = async (blockedId: string) => {
    if (!user?.userId) return
    setUnblockingId(blockedId)
    try {
      const ok = await blockService.unblockUser(user.userId, blockedId)
      if (!ok) throw new Error("unblock failed")
      setBlockedUsers((prev) => prev.filter((u) => u.userId !== blockedId))
      toast.success(te("Usuario desbloqueado", "User unblocked"))
    } catch {
      toast.error(te("Error al desbloquear", "Error unblocking user"))
    } finally {
      setUnblockingId(null)
    }
  }

  const savePrivacySettings = async () => {
    setSavingPrivacy(true)
    try {
      await privacyService.updateSettings(privacySettings)
      toast.success(te("Privacidad actualizada", "Privacy updated"))
    } catch {
      toast.error(te("Error al guardar privacidad", "Error saving privacy"))
    } finally {
      setSavingPrivacy(false)
    }
  }

  const handleRemoveFromSparklingList = async (memberId: string) => {
    try {
      await privacyService.removeFromSparklingList(memberId)
      setSparklingList(prev => prev.filter(m => m.userId !== memberId))
      toast.success(te("Eliminado de Sparkling List", "Removed from Sparkling List"))
    } catch {
      toast.error(te("Error al eliminar", "Error removing"))
    }
  }

  useEffect(() => {
    fetchPreferences()
    fetchInterests()
    fetchPrivacySettings()
    fetchBlockedUsers()
  }, [fetchPreferences, fetchInterests, fetchPrivacySettings, fetchBlockedUsers])

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

  const verifiedRecoveryEmail = user?.recoveryEmail?.trim()
  const recoveryEmailDisplayLine =
    verifiedRecoveryEmail || pendingRecoveryTargetEmail || ""

  const handleSaveExperienceClick = () => {
    if (!user) return
    const nextAccountType = experienceObjectiveToAccountType(objective)
    const currentAccountType = (user.accountType ?? "").toUpperCase()
    if (nextAccountType !== currentAccountType) {
      setShowExperienceConfirm(true)
    } else {
      saveExperience()
    }
  }

  const saveExperience = async () => {
    if (!user) {
      toast.error(te("Inicia sesión para guardar", "Sign in to save"))
      return
    }
    if (!(user.username ?? "").trim()) {
      toast.error(te(
        "Añade un nombre de usuario en Editar perfil antes de guardar la experiencia.",
        "Add a username in Edit profile before saving experience."
      ))
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

      toast.success(te("Experiencia guardada", "Experience saved"))
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        toast.error(te(
          "Solo puedes cambiar el tipo de cuenta una vez por mes.",
          "You can only change your account type once per month."
        ))
      } else if (err instanceof ApiError) {
        toast.error(err.message)
      } else {
        toast.error(
          err instanceof Error ? err.message : te("Error al guardar experiencia", "Error saving experience")
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
      
      toast.success(te("Preferencias guardadas", "Preferences saved"))
    } catch {
      toast.error(te("Error al guardar", "Error saving"))
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
        toast.success(te("Interés eliminado", "Interest removed"))
      } else {
        await api.post(`/api/interests/add/${interestId}`)
        toast.success(te("Interés agregado", "Interest added"))
      }
      fetchInterests()
      await refreshProfile()
    } catch {
      // Fallback: guardar localmente
      let updated: Interest[]
      if (isSelected) {
        updated = myInterests.filter((i) => i.interestId !== interestId)
        toast.success(te("Interés eliminado", "Interest removed"))
      } else {
        updated = [...myInterests, interest]
        toast.success(te("Interés agregado", "Interest added"))
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
      toast.error(te("Escribe y confirma el nuevo correo", "Type and confirm the new email"))
      return
    }
    const next = normalizeEmailValue(newEmail)
    const again = normalizeEmailValue(confirmNewEmail)
    if (next !== again) {
      toast.error(te("Los correos no coinciden. Revisa mayúsculas, espacios o copia el mismo texto en ambos campos.", "Emails do not match. Check casing/spaces or copy the same text in both fields."))
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(next)) {
      toast.error(te("Ingresa un correo válido", "Enter a valid email"))
      return
    }
    const current = (user?.email || "").trim().toLowerCase()
    if (current && next === current) {
      toast.error(te("El nuevo correo es igual al actual", "New email is the same as current"))
      return
    }
    setChangingEmail(true)
    try {
      await authService.requestEmailChange(next)
      localStorage.setItem(PENDING_EMAIL_CHANGE_KEY, "1")
      setEmailChangeCodePending(true)
      setEmailChangeCode("")
      toast.success(
        te("Código enviado al nuevo correo. Baja un poco e introdúcelo en el campo de verificación de esta misma pantalla (Configuración → Cuenta).", "Code sent to the new email. Scroll down and enter it in the verification field on this screen (Settings → Account).")
      )
      setShowChangeEmail(false)
      setNewEmail("")
      setConfirmNewEmail("")
      await refreshProfile()
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : te("Error al solicitar el cambio de correo", "Error requesting email change")
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
      toast.error(te("Escribe el código que recibiste", "Enter the code you received"))
      return
    }
    setVerifyingEmailCode(true)
    try {
      await authService.verifyEmailChange(c)
      clearEmailChangePending()
      await refreshProfile()
      toast.success(te("Correo actualizado correctamente", "Email updated successfully"))
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : te("Código incorrecto o expirado", "Incorrect or expired code")
      )
    } finally {
      setVerifyingEmailCode(false)
    }
  }

  const clearRecoveryCodePending = () => {
    localStorage.removeItem(PENDING_RECOVERY_KEY)
    setRecoveryCodePending(false)
    setPendingRecoveryTargetEmail("")
    setRecoveryCode("")
  }

  const handleRequestRecovery = async () => {
    if (!newRecoveryEmail.trim() || !confirmRecoveryEmail.trim()) {
      toast.error(te("Escribe y confirma el correo de recuperación", "Type and confirm recovery email"))
      return
    }
    const next = normalizeEmailValue(newRecoveryEmail)
    const again = normalizeEmailValue(confirmRecoveryEmail)
    if (next !== again) {
      toast.error(te("Los correos de recuperación no coinciden", "Recovery emails do not match"))
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(next)) {
      toast.error(te("Ingresa un correo válido", "Enter a valid email"))
      return
    }
    const primary = (user?.email || "").trim().toLowerCase()
    if (next === primary) {
      toast.error(te(
        "El correo de recuperación no puede ser igual al correo principal",
        "Recovery email cannot be the same as primary email"
      ))
      return
    }
    const currentRec = (user?.recoveryEmail || "").trim().toLowerCase()
    if (currentRec && next === currentRec) {
      toast.error(te("Ese email ya es tu correo de recuperación", "That email is already your recovery email"))
      return
    }
    setChangingRecovery(true)
    try {
      await authService.requestRecoveryEmail(next)
      localStorage.setItem(PENDING_RECOVERY_KEY, next)
      setPendingRecoveryTargetEmail(next)
      setRecoveryCodePending(true)
      setRecoveryCode("")
      toast.success(
        te("Código enviado. Revísalo en el buzón de ese correo (no en el principal) e introdúcelo abajo.", "Code sent. Check that inbox (not your primary one) and enter it below.")
      )
      setShowRecoveryForm(false)
      setNewRecoveryEmail("")
      setConfirmRecoveryEmail("")
      await refreshProfile()
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : te("Error al solicitar el correo de recuperación", "Error requesting recovery email")
      )
    } finally {
      setChangingRecovery(false)
    }
  }

  const handleVerifyRecoveryCode = async () => {
    const c = recoveryCode.trim()
    if (!c) {
      toast.error(te("Escribe el código de recuperación", "Enter the recovery code"))
      return
    }
    setVerifyingRecoveryCode(true)
    try {
      await authService.verifyRecoveryEmail(c)
      clearRecoveryCodePending()
      await refreshProfile()
      toast.success(te("Correo de recuperación guardado", "Recovery email saved"))
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : te("Código incorrecto o expirado", "Incorrect or expired code")
      )
    } finally {
      setVerifyingRecoveryCode(false)
    }
  }

  const handleDeleteRecovery = async () => {
    setDeletingRecovery(true)
    try {
      await authService.deleteRecoveryEmail()
      clearRecoveryCodePending()
      setShowRecoveryForm(false)
      await refreshProfile()
      toast.success(te("Correo de recuperación eliminado", "Recovery email removed"))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : te("No se pudo eliminar", "Could not remove"))
    } finally {
      setDeletingRecovery(false)
    }
  }

  const handlePromoteRecoveryToPrimary = async () => {
    if (!user?.recoveryEmail) {
      toast.error(te("Primero añade y verifica un correo de recuperación", "First add and verify a recovery email"))
      return
    }
    setPromotingPrimary(true)
    try {
      await authService.deletePrimaryEmail()
      clearRecoveryCodePending()
      clearEmailChangePending()
      setShowChangeEmail(false)
      setShowRecoveryForm(false)
      await refreshProfile()
      toast.success(te("Tu antiguo correo de recuperación es ahora el correo principal", "Your former recovery email is now the primary email"))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : te("No se pudo completar", "Could not complete"))
    } finally {
      setPromotingPrimary(false)
    }
  }

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      toast.error(te("Completa todos los campos", "Fill all fields"))
      return
    }
    if (newPassword.length < 6) {
      toast.error(te("La nueva contraseña debe tener al menos 6 caracteres", "New password must be at least 6 characters"))
      return
    }
    if (newPassword !== confirmNewPassword) {
      toast.error(te("Las contraseñas no coinciden", "Passwords do not match"))
      return
    }
    setChangingPassword(true)
    try {
      await authService.changePassword({
        currentPassword,
        newPassword,
      })
      toast.success(te("Contraseña actualizada", "Password updated"))
      setShowChangePassword(false)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmNewPassword("")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : te("Error al cambiar contraseña", "Error changing password"))
    } finally {
      setChangingPassword(false)
    }
  }

  const handleDeleteProfile = async () => {
    try {
      await api.delete("/api/profile")
      toast.success(te("Perfil eliminado", "Profile deleted"))
      logout()
    } catch {
      toast.error(te("Error al eliminar perfil", "Error deleting profile"))
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="mb-6 text-xl font-bold text-foreground">{te("Configuración", "Settings")}</h1>

      {/* Privacy Settings - Backend */}
      <Card className="border-border bg-card mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground text-base">
            <Shield className="h-4 w-4" />
            {te("Privacidad", "Privacy")}
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
                  <Label className="text-foreground font-medium">{te("¿Quién puede ver mis posts?", "Who can see my posts?")}</Label>
                </div>
                <Select
                  value={privacySettings.whoCanSeeMyPosts}
                  onValueChange={(v) => setPrivacySettings(p => ({ ...p, whoCanSeeMyPosts: v as any }))}
                >
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EVERYONE">{te("Todos", "Everyone")}</SelectItem>
                    <SelectItem value="FOLLOWERS">{te("Seguidores", "Followers")}</SelectItem>
                    <SelectItem value="NOBODY">{te("Nadie", "Nobody")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-foreground font-medium">{te("¿Quién puede comentar?", "Who can comment?")}</Label>
                </div>
                <Select
                  value={privacySettings.whoCanComment}
                  onValueChange={(v) => setPrivacySettings(p => ({ ...p, whoCanComment: v as any }))}
                >
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EVERYONE">{te("Todos", "Everyone")}</SelectItem>
                    <SelectItem value="FOLLOWERS">{te("Seguidores", "Followers")}</SelectItem>
                    <SelectItem value="NOBODY">{te("Nadie", "Nobody")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-foreground font-medium">{te("¿Quién puede enviarme DMs?", "Who can send me DMs?")}</Label>
                </div>
                <Select
                  value={privacySettings.whoCanSendDM}
                  onValueChange={(v) => setPrivacySettings(p => ({ ...p, whoCanSendDM: v as any }))}
                >
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EVERYONE">{te("Todos", "Everyone")}</SelectItem>
                    <SelectItem value="FOLLOWERS">{te("Seguidores", "Followers")}</SelectItem>
                    <SelectItem value="MATCHES">{te("Matches", "Matches")}</SelectItem>
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

      <VirtualLocationCard
        isPremium={isPremium}
        hasVirtual={feedLocation.hasVirtualLocation}
        loading={feedLocation.loading}
        onSetVirtual={feedLocation.setVirtualLocation}
        onClearVirtual={feedLocation.clearVirtualLocation}
      />

      {/* Blocked users */}
      <Card className="border-border bg-card mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground text-base">
            <Ban className="h-4 w-4" />
            {te("Usuarios bloqueados", "Blocked users")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {blockedLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : blockedUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {te("No has bloqueado a nadie.", "You have not blocked anyone.")}
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {blockedUsers.map((u) => (
                <div
                  key={u.userId}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {u.nombres || u.username || te("Usuario", "User")}
                    </p>
                    {u.username ? (
                      <p className="truncate text-xs text-muted-foreground">@{u.username}</p>
                    ) : null}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={unblockingId === u.userId}
                    onClick={() => void handleUnblockUser(u.userId)}
                  >
                    {unblockingId === u.userId ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      te("Desbloquear", "Unblock")
                    )}
                  </Button>
                </div>
              ))}
            </div>
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

      {/* Bottom navigation style */}
      <Card className="border-border bg-card mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground text-base">
            <Layout className="h-4 w-4" />
            Barra de navegación inferior
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-xs text-muted-foreground leading-relaxed">
            Elige el estilo de la barra inferior. El dock Sparkd sigue disponible; las opciones plana y
            dating son las del diseño de referencia.
          </p>
          <NavbarStylePicker />
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
            <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
              {t("dm.accountModeIsolationHint")}
            </p>
            <Button
              type="button"
              onClick={handleSaveExperienceClick}
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

          <AlertDialog open={showExperienceConfirm} onOpenChange={setShowExperienceConfirm}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {te("¿Cambiar tipo de cuenta?", "Change account type?")}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {te(
                    "Solo puedes cambiar el tipo de cuenta una vez por mes. Esta acción no se puede deshacer hasta que pase ese tiempo. ¿Deseas continuar?",
                    "You can only change your account type once per month. This action cannot be undone until that time passes. Do you want to continue?"
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{te("Cancelar", "Cancel")}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    setShowExperienceConfirm(false)
                    saveExperience()
                  }}
                >
                  {te("Sí, cambiar", "Yes, change")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
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
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { value: "MALE" as const, label: "Hombres" },
                      { value: "FEMALE" as const, label: "Mujeres" },
                      { value: "BOTH" as const, label: "Ambos" },
                    ] as const
                  ).map(({ value, label }) => (
                    <Button
                      key={value}
                      type="button"
                      variant={interestedIn === value ? "default" : "outline"}
                      onClick={() => setInterestedIn(value)}
                      className={
                        interestedIn === value
                          ? "bg-primary text-primary-foreground"
                          : "border-border text-foreground hover:bg-muted"
                      }
                    >
                      {label}
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
          <PasskeysSection user={user} />

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
                  <span className="text-sm font-semibold">Paso 2: código — correo principal</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Revisa el mensaje en el <strong>correo nuevo</strong> que quieres poner (spam incluido),
                  copia el código y confirma.
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

          <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-3">
            <div className="flex items-center gap-2 text-foreground">
              <Shield className="h-4 w-4 shrink-0" />
              <span className="text-sm font-semibold">Correo de recuperación</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Debe ser <strong>distinto del correo principal</strong>. Si olvidas la contraseña o pierdes
              acceso al principal, podrás usar este buzón; el código de verificación llega aquí, no al correo
              principal.
            </p>
            <div className="space-y-2">
              {!recoveryEmailDisplayLine ? (
                <div className="rounded-md border border-dashed border-border bg-muted/30 px-3 py-2.5 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Sin configurar.</span> Pulsa{" "}
                  <span className="text-foreground">«Añadir o actualizar correo de recuperación»</span>,
                  indica un correo distinto al principal y confirma con el código que te enviemos a ese buzón.
                </div>
              ) : (
                <>
                  <Label className="text-foreground text-sm">
                    {verifiedRecoveryEmail
                      ? "Correo de recuperación registrado"
                      : "Correo pendiente de verificar"}
                  </Label>
                  <Input
                    readOnly
                    value={recoveryEmailDisplayLine}
                    className="bg-muted/50 border-border text-foreground"
                  />
                  {pendingRecoveryTargetEmail && !verifiedRecoveryEmail && (
                    <p className="text-xs text-amber-600 dark:text-amber-500">
                      Revisa la bandeja de este correo e introduce el código más abajo. Al confirmar, quedará
                      guardado como correo de recuperación.
                    </p>
                  )}
                </>
              )}
            </div>
            {!!user?.recoveryEmail && (
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full sm:w-auto border-destructive/50 text-destructive hover:bg-destructive/10"
                      disabled={deletingRecovery}
                    >
                      {deletingRecovery ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Quitar correo de recuperación"
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Quitar el correo de recuperación?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Podrás añadir otro más adelante. Perderás una vía de recuperación mientras no haya
                        reemplazo.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Volver</AlertDialogCancel>
                      <AlertDialogAction onClick={() => void handleDeleteRecovery()}>
                        Sí, quitar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      type="button"
                      variant="secondary"
                      className="w-full sm:w-auto"
                      disabled={promotingPrimary}
                    >
                      {promotingPrimary ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Hacer el de recuperación mi correo principal"
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Intercambiar roles de correo</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tu correo de recuperación actual pasará a ser el <strong>principal</strong> y
                        dejará de mostrarse como secundario. Así lo hace el servidor al “eliminar” el
                        principal.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => void handlePromoteRecoveryToPrimary()}>
                        Confirmar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowRecoveryForm((v) => !v)
                setNewRecoveryEmail("")
                setConfirmRecoveryEmail("")
              }}
              className="w-full justify-start border-border text-foreground hover:bg-muted"
            >
              <Shield className="mr-2 h-4 w-4" />
              {showRecoveryForm ? "Ocultar" : "Añadir o actualizar correo de recuperación"}
            </Button>
            {showRecoveryForm && (
              <div className="space-y-3 pt-1 border-t border-border">
                <div className="flex flex-col gap-2">
                  <Label className="text-foreground text-sm">Nuevo correo de recuperación</Label>
                  <Input
                    type="email"
                    autoComplete="off"
                    name="recovery-new-email"
                    value={newRecoveryEmail}
                    onChange={(e) => setNewRecoveryEmail(e.target.value)}
                    onBlur={() => setNewRecoveryEmail((s) => s.trim())}
                    placeholder="otro@correo.com"
                    className="bg-background border-border"
                    disabled={changingRecovery}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-foreground text-sm">Confirmar</Label>
                  <Input
                    type="email"
                    autoComplete="off"
                    name="recovery-confirm-email"
                    value={confirmRecoveryEmail}
                    onChange={(e) => setConfirmRecoveryEmail(e.target.value)}
                    onBlur={() => setConfirmRecoveryEmail((s) => s.trim())}
                    placeholder="Mismo correo otra vez"
                    className="bg-background border-border"
                    disabled={changingRecovery}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={handleRequestRecovery}
                    disabled={changingRecovery}
                    className="flex-1 bg-primary text-primary-foreground"
                  >
                    {changingRecovery ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Solicitar código al correo de recuperación"
                    )}
                  </Button>
                </div>
              </div>
            )}

            {recoveryCodePending && (
              <div className="space-y-2 border-t border-border pt-3 mt-1">
                <div className="flex items-center gap-2 text-foreground">
                  <Check className="h-4 w-4 shrink-0" />
                  <span className="text-sm font-semibold">Paso 2: código — correo de recuperación</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  El mensaje con el código se envió a la dirección <strong>de recuperación</strong> (no al
                  principal). Revisa su bandeja.
                </p>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                  <div className="flex-1">
                    <Label className="text-foreground text-sm">Código de verificación</Label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      name="recovery-email-code"
                      value={recoveryCode}
                      onChange={(e) => setRecoveryCode(e.target.value.replace(/\s/g, ""))}
                      placeholder="Código de 6 dígitos (ej.)"
                      className="bg-background border-border"
                      disabled={verifyingRecoveryCode}
                    />
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      type="button"
                      onClick={handleVerifyRecoveryCode}
                      disabled={verifyingRecoveryCode}
                      className="bg-primary text-primary-foreground"
                    >
                      {verifyingRecoveryCode ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Verificar y guardar"
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={clearRecoveryCodePending}
                      disabled={verifyingRecoveryCode}
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
