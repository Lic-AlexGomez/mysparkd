"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
import type { Interest, Sex } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Loader2, ArrowRight, ArrowLeft, Check } from "lucide-react"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"

export default function OnboardingPage() {
  const { refreshProfile } = useAuth()
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)

  // Step 1: Profile
  const [nombres, setNombres] = useState("")
  const [apellidos, setApellidos] = useState("")
  const [sex, setSex] = useState<Sex>("MALE")
  const [telefono, setTelefono] = useState("")

  // Step 2: Interests
  const [allInterests, setAllInterests] = useState<Interest[]>([])
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])

  // Step 3: Preferences
  const [interestedIn, setInterestedIn] = useState<Sex>("FEMALE")
  const [ageRange, setAgeRange] = useState([18, 35])
  const [showMe, setShowMe] = useState(true)

  const fetchInterests = useCallback(async () => {
    try {
      const data = await api.get<Interest[]>("/api/interests")
      setAllInterests(data)
    } catch {
      // silent
    }
  }, [])

  useEffect(() => {
    fetchInterests()
  }, [fetchInterests])

  const handleStep1 = async () => {
    if (!nombres.trim() || !apellidos.trim() || !telefono.trim()) {
      toast.error("Completa todos los campos")
      return
    }
    setIsLoading(true)
    try {
      await api.post("/api/profile", {
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        sex,
        telefono: telefono.trim(),
      })
      setStep(2)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al crear perfil")
    } finally {
      setIsLoading(false)
    }
  }

  const handleStep2 = async () => {
    setIsLoading(true)
    try {
      for (const interestId of selectedInterests) {
        await api.post(`/api/interests/add/${interestId}`)
      }
      setStep(3)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar intereses")
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
      toast.success("Perfil completado!")
      router.push("/feed")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar preferencias")
    } finally {
      setIsLoading(false)
    }
  }

  const toggleInterest = (id: string) => {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const categories = [...new Set(allInterests.map((i) => i.category))]

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      {/* Progress bar */}
      <div className="mb-8 flex gap-2">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              s <= step ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>

      {step === 1 && (
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">Completa tu perfil</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label className="text-foreground">Nombres</Label>
              <Input
                value={nombres}
                onChange={(e) => setNombres(e.target.value)}
                placeholder="Tu nombre"
                className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-foreground">Apellidos</Label>
              <Input
                value={apellidos}
                onChange={(e) => setApellidos(e.target.value)}
                placeholder="Tu apellido"
                className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-foreground">Genero</Label>
              <div className="flex gap-2">
                {(["MALE", "FEMALE"] as Sex[]).map((s) => (
                  <Button
                    key={s}
                    type="button"
                    variant={sex === s ? "default" : "outline"}
                    onClick={() => setSex(s)}
                    className={
                      sex === s
                        ? "bg-primary text-primary-foreground"
                        : "border-border text-foreground hover:bg-muted"
                    }
                  >
                    {s === "MALE" ? "Hombre" : "Mujer"}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-foreground">Telefono</Label>
              <Input
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="+1 234 567 8900"
                className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <Button
              onClick={handleStep1}
              disabled={isLoading}
              className="mt-2 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="mr-2 h-4 w-4" />
              )}
              Siguiente
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">Tus intereses</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {categories.map((category) => (
              <div key={category}>
                <p className="mb-2 text-sm font-medium text-muted-foreground">
                  {category}
                </p>
                <div className="flex flex-wrap gap-2">
                  {allInterests
                    .filter((i) => i.category === category)
                    .map((interest) => {
                      const selected = selectedInterests.includes(
                        interest.interestId
                      )
                      return (
                        <button
                          key={interest.interestId}
                          onClick={() => toggleInterest(interest.interestId)}
                          className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                            selected
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          }`}
                        >
                          {selected && <Check className="h-3 w-3" />}
                          {interest.name}
                        </button>
                      )
                    })}
                </div>
              </div>
            ))}
            {allInterests.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-4">
                No hay intereses disponibles
              </p>
            )}
            <div className="flex gap-2 mt-2">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="border-border text-foreground"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Atras
              </Button>
              <Button
                onClick={handleStep2}
                disabled={isLoading}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="mr-2 h-4 w-4" />
                )}
                Siguiente
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">Tus preferencias</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
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
                className="w-full"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-foreground">
                Mostrarme en busquedas
              </Label>
              <Switch checked={showMe} onCheckedChange={setShowMe} />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setStep(2)}
                className="border-border text-foreground"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Atras
              </Button>
              <Button
                onClick={handleStep3}
                disabled={isLoading}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
                Completar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
