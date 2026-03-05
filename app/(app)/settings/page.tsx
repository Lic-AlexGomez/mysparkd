"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import type { UserPreferences, Interest, Sex } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
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
  Sparkles,
  Trash2,
  LogOut,
  Check,
  X,
} from "lucide-react"

export default function SettingsPage() {
  const { user, logout, refreshProfile } = useAuth()
  const router = useRouter()

  // Preferences
  const [preferences, setPreferences] = useState<UserPreferences | null>(null)
  const [interestedIn, setInterestedIn] = useState<Sex>("FEMALE")
  const [ageRange, setAgeRange] = useState([18, 35])
  const [showMe, setShowMe] = useState(true)
  const [isPrivate, setIsPrivate] = useState(false)
  const [connectionMode, setConnectionMode] = useState(true)
  const [objective, setObjective] = useState('both')
  const [prefLoading, setPrefLoading] = useState(true)
  const [savingPref, setSavingPref] = useState(false)

  // Interests
  const [allInterests, setAllInterests] = useState<Interest[]>([])
  const [myInterests, setMyInterests] = useState<Interest[]>([])
  const [interestsLoading, setInterestsLoading] = useState(true)

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

  useEffect(() => {
    fetchPreferences()
    fetchInterests()
    
    // Cargar configuraciones locales
    if (user?.userId) {
      const saved = localStorage.getItem(`sparkd_settings_${user.userId}`)
      if (saved) {
        const settings = JSON.parse(saved)
        setIsPrivate(settings.isPrivate ?? false)
        setConnectionMode(settings.connectionMode ?? true)
        setObjective(settings.objective ?? 'both')
      }
    }
  }, [fetchPreferences, fetchInterests, user])

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
          objective
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

      {/* Privacy & Mode */}
      <Card className="border-border bg-card mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground text-base">
            <SlidersHorizontal className="h-4 w-4" />
            Privacidad y Modo
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
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
              {[
                { id: 'social', label: '🤝 Social', desc: 'Solo red social' },
                { id: 'connection', label: '💫 Conexión', desc: 'Solo dating/matching' },
                { id: 'both', label: '⚡ Ambos', desc: 'Experiencia completa' },
              ].map((exp) => (
                <button
                  key={exp.id}
                  onClick={() => setObjective(exp.id)}
                  className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                    objective === exp.id
                      ? 'bg-primary/10 border border-primary'
                      : 'bg-muted border border-transparent hover:bg-muted/80'
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
            <Sparkles className="h-4 w-4" />
            Mis intereses
          </CardTitle>
        </CardHeader>
        <CardContent>
          {interestsLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {allInterests.map((interest) => {
                const isSelected = myInterests.some(
                  (i) => i.interestId === interest.interestId
                )
                return (
                  <button
                    key={interest.interestId}
                    onClick={() => toggleInterest(interest.interestId)}
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {isSelected && <Check className="h-3 w-3" />}
                    {interest.name}
                  </button>
                )
              })}
              {allInterests.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No hay intereses disponibles
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account actions */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground text-base">Cuenta</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
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
