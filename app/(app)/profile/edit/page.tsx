"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
import type { UserProfile } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { LocationInput } from "@/components/ui/location-input"
import { ArrowLeft, Loader2, Save, Camera, Crown } from "lucide-react"
import { toast } from "sonner"
import { Switch } from "@/components/ui/switch"
import { VoiceNoteRecorder } from "@/components/ui/voice-note"

export default function EditProfilePage() {
  const router = useRouter()
  const { user, isLoading: authLoading, refreshProfile, updateUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [showPremiumBadge, setShowPremiumBadge] = useState(() => {
    if (typeof window === 'undefined') return true
    const userId = localStorage.getItem('sparkd_user_id') || ''
    return localStorage.getItem(`sparkd_show_premium_${userId}`) !== 'false'
  })
  const [formData, setFormData] = useState({
    username: "",
    bio: "",
    location: "",
    url: "",
    coverPictureUrl: "",
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
        latitude: user.latitude,
        longitude: user.longitude
      })
      setShowPremiumBadge(user.showPremiumBadge ?? true)
    }
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user) return

    setLoading(true)
    try {
      const body: any = {
        nombres: user.nombres,
        apellidos: user.apellidos,
        sex: user.sex,
        dateOfBirth: user.dateOfBirth,
        telefono: user.telefono,
        bio: formData.bio || null,
        url: formData.url || null,
        showPremiumBadge,
      }
      // Solo mandar coords si el usuario seleccionó una ubicación
      if (formData.latitude && formData.longitude) {
        body.latitude = formData.latitude
        body.longitude = formData.longitude
      }
      await api.put('/api/profile', body)
      updateUser({ bio: formData.bio || null, url: formData.url || undefined, showPremiumBadge })
      toast.success("Perfil actualizado")
      window.location.href = '/profile'
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al actualizar perfil")
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
      toast.success("Foto de portada actualizada")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al subir foto")
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
        <h1 className="text-2xl font-bold">Editar perfil</h1>
      </div>

      <Card className="p-6 bg-card border-border">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Cover Photo */}
          <div className="space-y-2">
            <Label>Foto de portada</Label>
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
                            {formData.coverPictureUrl ? 'Cambiar portada' : 'Subir portada'}
                          </span>
                        </>
                      )}
                    </div>
                  </label>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Recomendado: 1500x500px</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="tu_username"
              maxLength={30}
            />
            <p className="text-xs text-muted-foreground">Mínimo 3 caracteres</p>
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
            <Label htmlFor="location">Ubicación</Label>
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
              placeholder="Busca tu ciudad o dirección..."
            />
            <p className="text-xs text-muted-foreground">Escribe al menos 3 caracteres para buscar</p>
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
                  <p className="text-sm font-semibold text-foreground">Badge Premium</p>
                  <p className="text-xs text-muted-foreground">Mostrar en tu perfil</p>
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

          <div className="space-y-2">
            <Label>Nota de voz</Label>
            <p className="text-xs text-muted-foreground">Graba hasta 30 segundos para presentarte</p>
            <VoiceNoteRecorder
              currentUrl={user.voiceIntroUrl || user.voiceNoteUrl}
              onSaved={(url) => updateUser({ voiceIntroUrl: url ?? null, voiceNoteUrl: url ?? null })}
            />
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Guardando...</> : <><Save className="mr-2 h-4 w-4" />Guardar</>}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
