"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { api, ApiError } from "@/lib/api"
import { profileService } from "@/lib/services/profile"
import { toBackendAccountType } from "@/lib/account-type"
import type { UpdateProfileRequest } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { LocationInput } from "@/components/ui/location-input"
import { ArrowLeft, Loader2, Save, Camera, Crown, Square, Globe, Lock } from "lucide-react"
import { toast } from "sonner"
import { Switch } from "@/components/ui/switch"
import { VoiceNoteRecorder, type VoiceNoteRecorderHandle } from "@/components/ui/voice-note"
import { useI18n } from "@/lib/i18n"
import { getUsernameFormatError } from "@/lib/username-policy"

export default function EditProfilePage() {
  const { te, t, language } = useI18n()
  const router = useRouter()
  const { user, isLoading: authLoading, refreshProfile, updateUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [isVoiceRecording, setIsVoiceRecording] = useState(false)
  const voiceRecorderRef = useRef<VoiceNoteRecorderHandle>(null)
  const isVoiceRecordingRef = useRef(false)
  const [showPremiumBadge, setShowPremiumBadge] = useState(() => {
    if (typeof window === 'undefined') return true
    const userId = localStorage.getItem('sparkd_user_id') || ''
    return localStorage.getItem(`sparkd_show_premium_${userId}`) !== 'false'
  })
  const [usernameError, setUsernameError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    username: "",
    bio: "",
    location: "",
    url: "",
    coverPictureUrl: "",
    visibility: "PUBLIC" as "PUBLIC" | "PRIVATE",
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined
  })

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || "",
        bio: user.bio || "",
        location: user.location || "",
        url: user.url || user.website || "",
        coverPictureUrl: user.coverPictureUrl || "",
        visibility: user.visibility || "PUBLIC",
        latitude: user.latitude,
        longitude: user.longitude
      })
      setShowPremiumBadge(user.showPremiumBadge ?? true)
    }
  }, [user])

  const validateUsername = (raw: string): string | null => {
    const err = getUsernameFormatError(raw)
    if (!err) return null
    if (err.includes("al menos")) return te("Mínimo 3 caracteres", "Minimum 3 characters")
    if (err.includes("Máximo")) return te("Máximo 30 caracteres", "Maximum 30 characters")
    return te(
      "Solo letras sin acento, números; punto y guion bajo solo en medio",
      "ASCII letters and numbers only; dot and underscore only in the middle"
    )
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    if (!user) return

    if (isVoiceRecordingRef.current && voiceRecorderRef.current) {
      toast.info(te('Guardando nota de voz...', 'Saving voice note...'))
      await voiceRecorderRef.current.stopAndUpload()
    }

    const uErr = validateUsername(formData.username)
    if (uErr) {
      setUsernameError(uErr)
      toast.error(uErr)
      return
    }
    setUsernameError(null)

    setLoading(true)
    try {
      const at = user.accountType
      const accountType = toBackendAccountType(
        at != null && String(at).trim() !== ""
          ? String(at).trim()
          : user.premium
            ? "BOTH"
            : "SOCIAL"
      )

      const body: UpdateProfileRequest = {
        nombres: user.nombres,
        apellidos: user.apellidos,
        username: formData.username.trim(),
        accountType,
        sex: user.sex,
        dateOfBirth: user.dateOfBirth,
        telefono: user.telefono || "",
        bio: formData.bio || null,
        url: formData.url || null,
        visibility: formData.visibility,
        showPremiumBadge,
        preferredLanguage: language,
      }
      // Solo mandar coords si el usuario seleccionó una ubicación
      if (formData.latitude && formData.longitude) {
        body.latitude = formData.latitude
        body.longitude = formData.longitude
      }
      await profileService.updateMyProfile(body)
      updateUser({
        username: formData.username.trim(),
        accountType,
        bio: formData.bio || undefined,
        url: formData.url || undefined,
        showPremiumBadge,
        visibility: formData.visibility,
      })
      await refreshProfile()
      toast.success(te("Perfil actualizado", "Profile updated"))
      router.push("/profile")
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 409) {
          toast.error(
            error.message || te("Este nombre de usuario ya está en uso", "This username is already in use")
          )
        } else if (error.status === 403) {
          // Backend usa 403 (p. ej. PlanLimitException) si el @ ya existe
          toast.error(
            error.message || te("No se pudo usar este nombre de usuario", "Could not use this username")
          )
        } else if (error.status === 400) {
          const msg = [error.message, error.details].filter(Boolean).join(" — ")
          toast.error(msg || te("Datos de perfil no válidos", "Invalid profile data"))
        } else {
          toast.error(error.message || te("Error al actualizar perfil", "Error updating profile"))
        }
      } else {
        toast.error(
          error instanceof Error ? error.message : te("Error al actualizar perfil", "Error updating profile")
        )
      }
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const handleCoverPhotoUpload = async (file: File) => {
    setUploadingCover(true)
    try {
      const formDataUpload = new FormData()
      formDataUpload.append('file', file)
      const data = await api.post<{ url: string; message: string }>('/api/photos/cover-picture', formDataUpload)
      setFormData(prev => ({ ...prev, coverPictureUrl: data.url }))
      toast.success(te("Foto de portada actualizada", "Cover photo updated"))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : te("Error al subir foto", "Error uploading photo"))
    } finally {
      setUploadingCover(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">{te("Editar perfil", "Edit profile")}</h1>
      </div>

      <Card className="p-6 bg-card border-border">
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit() }} className="space-y-6">
          {/* Cover Photo */}
          <div className="space-y-2">
            <Label>{te("Foto de portada", "Cover photo")}</Label>
            <div className="relative">
              <div 
                className="h-48 rounded-lg bg-gradient-to-r from-secondary/40 via-primary/30 to-secondary/20 relative overflow-hidden"
                style={{
                  backgroundImage: formData.coverPictureUrl ? `url(${formData.coverPictureUrl})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleCoverPhotoUpload(file)
                      }}
                      disabled={uploadingCover}
                    />
                    <div className="flex flex-col items-center gap-2 text-white">
                      {uploadingCover ? (
                        <Loader2 className="h-8 w-8 animate-spin" />
                      ) : (
                        <>
                          <Camera className="h-8 w-8" />
                          <span className="text-sm font-medium">
                            {formData.coverPictureUrl ? te('Cambiar portada', 'Change cover') : te('Subir portada', 'Upload cover')}
                          </span>
                        </>
                      )}
                    </div>
                  </label>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{te("Recomendado: 1500x500px", "Recommended: 1500x500px")}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">{te("Nombre de usuario", "Username")}</Label>
            <Input
              id="username"
              value={formData.username}
              onChange={(e) => {
                setFormData({ ...formData, username: e.target.value })
                setUsernameError(null)
              }}
              placeholder="tu_usuario"
              maxLength={30}
              className={usernameError ? "border-destructive" : undefined}
              aria-invalid={!!usernameError}
            />
            <p className="text-xs text-muted-foreground">
              {te("3–30 caracteres: letras, números, punto y guion bajo", "3-30 characters: letters, numbers, dot and underscore")}
            </p>
            {usernameError ? (
              <p className="text-xs text-destructive">{usernameError}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Cuéntanos sobre ti..."
              className="min-h-24 resize-none"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">{formData.bio.length}/500</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">{te("Ubicación", "Location")}</Label>
            <LocationInput
              value={formData.location}
              onChange={(value, coordinates) => {
                setFormData({ 
                  ...formData, 
                  location: value,
                  latitude: coordinates?.latitude,
                  longitude: coordinates?.longitude
                })
              }}
              placeholder={te("Busca tu ciudad o dirección...", "Search your city or address...")}
            />
            <p className="text-xs text-muted-foreground">{te("Escribe al menos 3 caracteres para buscar", "Type at least 3 characters to search")}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Sitio web</Label>
            <Input
              id="website"
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              placeholder="https://tusitio.com"
              maxLength={200}
            />
          </div>

          {user.premium && (
            <div className="flex items-center justify-between p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/20">
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-yellow-500" />
                <div>
                  <p className="text-sm font-semibold text-foreground">{te("Badge Premium", "Premium badge")}</p>
                  <p className="text-xs text-muted-foreground">{te("Mostrar en tu perfil", "Show on your profile")}</p>
                </div>
              </div>
              <Switch
                checked={showPremiumBadge}
                onCheckedChange={(val) => {
                  setShowPremiumBadge(val)
                  localStorage.setItem(`sparkd_show_premium_${user.userId}`, String(val))
                }}
              />
            </div>
          )}

          <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card">
            <div className="flex items-center gap-2">
              {formData.visibility === 'PRIVATE' ? <Lock className="h-4 w-4 text-muted-foreground" /> : <Globe className="h-4 w-4 text-primary" />}
              <div>
                <p className="text-sm font-semibold text-foreground">{te("Perfil Público", "Public profile")}</p>
                <p className="text-xs text-muted-foreground">{te("Tu perfil puede ser visto por todos", "Your profile can be seen by everyone")}</p>
              </div>
            </div>
            <Switch
              checked={formData.visibility === 'PUBLIC'}
              onCheckedChange={(val) => setFormData({ ...formData, visibility: val ? 'PUBLIC' : 'PRIVATE' })}
            />
          </div>

          <div className="space-y-2">
            <Label>{te("Nota de voz", "Voice note")}</Label>
            <p className="text-xs text-muted-foreground">{te("Graba hasta 30 segundos para presentarte", "Record up to 30 seconds to introduce yourself")}</p>
            <VoiceNoteRecorder
              ref={voiceRecorderRef}
              currentUrl={user.voiceIntroUrl || user.voiceNoteUrl}
              onSaved={(url) => updateUser({ voiceIntroUrl: url ?? undefined, voiceNoteUrl: url ?? undefined })}
              onRecordingChange={(val) => { isVoiceRecordingRef.current = val; setIsVoiceRecording(val) }}
            />
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              onClick={() => handleSubmit()}
              disabled={loading}
              className="flex-1"
            >
              {loading
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{te("Guardando...", "Saving...")}</>
                : isVoiceRecording
                ? <><Square className="mr-2 h-4 w-4" />{te("Detener y guardar", "Stop and save")}</>
                : <><Save className="mr-2 h-4 w-4" />{t("common.save")}</>
              }
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
