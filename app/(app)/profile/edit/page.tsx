"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { LocationInput } from "@/components/ui/location-input"
import { ArrowLeft, Loader2, Save } from "lucide-react"
import { toast } from "sonner"
import { getFeatureFlags } from "@/lib/utils/feature-flags"
import { useFeatureFlags } from "@/hooks/use-feature-flags"

export default function EditProfilePage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const features = useFeatureFlags()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    username: "",
    bio: "",
    location: "",
    website: "",
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined
  })

  useEffect(() => {
    if (user) {
      console.log('Usuario cargado:', user)
      console.log('Username:', user.username)
      console.log('Bio:', user.bio)
      console.log('Location:', user.location)
      console.log('Website:', user.website)
      setFormData({
        username: user.username || "",
        bio: user.bio || "",
        location: user.location || "",
        website: user.website || "",
        latitude: user.latitude,
        longitude: user.longitude
      })
    }
  }, [user])

  // Redirigir si no tiene acceso a esta feature
  useEffect(() => {
    if (user && !features.profileEdit) {
      toast.error("Esta funcionalidad no está disponible aún")
      router.push(`/profile/${user.userId}`)
    }
  }, [user, features.profileEdit, router])

  if (!features.profileEdit) {
    return null
  }

  // Mostrar loading mientras se cargan los datos del usuario
  if (authLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.username && formData.username.length < 3) {
      toast.error("El username debe tener al menos 3 caracteres")
      return
    }

    setLoading(true)
    try {
      // Preparar datos para enviar
      const updateData: any = {
        username: formData.username,
        bio: formData.bio,
        location: formData.location,
        website: formData.website
      }
      
      // Si hay coordenadas, enviarlas también
      if (formData.latitude && formData.longitude) {
        updateData.latitude = formData.latitude
        updateData.longitude = formData.longitude
      }
      
      // TODO: await api.put('/api/profile/update', updateData)
      console.log('Datos a enviar:', updateData)
      toast.success("Perfil actualizado (pendiente backend)")
      router.push(`/profile/${user?.userId}`)
    } catch {
      toast.error("Error al actualizar perfil")
    } finally {
      setLoading(false)
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
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              placeholder="https://tusitio.com"
              maxLength={200}
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
