"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { eventService } from "@/lib/services/event"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { LocationInput } from "@/components/ui/location-input"
import { cn } from "@/lib/utils"
import {
  FORM_CHIP_BASE,
  FORM_CHIP_IDLE,
  FORM_CHIP_PRIMARY_ON,
  FORM_CHIP_SECONDARY_ON,
  FORM_CONTROL_INPUT,
  FORM_CONTROL_TEXTAREA,
  FORM_LABEL,
  FORM_LABEL_OPTIONAL_HINT,
  FORM_SELECT_TRIGGER,
} from "@/lib/form-field-classes"
import {
  ArrowLeft,
  Calendar,
  CalendarClock,
  CalendarDays,
  ChevronDown,
  Clock,
  DoorOpen,
  Heart,
  Layers,
  Link2,
  ListFilter,
  Loader2,
  MapPin,
  Plus,
  Search,
  ShieldCheck,
  Users,
  Zap,
} from "lucide-react"
import type { DateCard, DateCategory, Event, EventCategory, EventFilters, Plan, PlaceType } from "@/lib/types"
import { toast } from "sonner"
import { useI18n } from "@/lib/i18n"
import { useAuth } from "@/lib/auth-context"
import { FastDateSection } from "@/components/events/fast-date-section"
import { FastDateOfferCard } from "@/components/events/fast-date-offer-card"
import { AddressMapPicker } from "@/components/ui/address-map-picker"
import { fastDateService } from "@/lib/services/fastdate"
import { handleDateCardLimitError } from "@/lib/errors/date-card-limits"
import { useLocalizedCountryCode } from "@/hooks/use-localized-country-code"

const FD_CATEGORY_LABELS: Record<string, string> = {
  FOOD: "🍽️ Comida",
  ACTIVITY: "🎯 Actividad",
  EVENT: "🎉 Evento",
  CHILL: "😌 Chill",
  ADVENTURE: "🏔️ Aventura",
  OPEN_SUGGESTION: "💡 Abierto",
}
const FD_PLAN_LABELS: Record<string, string> = {
  CAFE: "☕ Café",
  RESTAURANT: "🍴 Restaurante",
  BAR: "🍸 Bar",
  PARK: "🌳 Parque",
  BEACH: "🏖️ Playa",
  MALL: "🛍️ Mall",
  CINEMA: "🎬 Cine",
  OTHER: "📍 Otro",
  OPEN_SUGGESTION: "💡 Sugerencia",
}
const FD_CATEGORIES: DateCategory[] = ["FOOD", "ACTIVITY", "EVENT", "CHILL", "ADVENTURE", "OPEN_SUGGESTION"]
const FD_PLANS: Plan[] = ["CAFE", "RESTAURANT", "BAR", "PARK", "BEACH", "MALL", "CINEMA", "OTHER", "OPEN_SUGGESTION"]

/** Iconos blancos sobre el campo fecha/hora (contraste con sombra en fondos claros). */
const WHEN_ICON =
  "pointer-events-none absolute left-3 top-1/2 z-[1] size-4 -translate-y-1/2 text-white drop-shadow-[0_1px_3px_rgb(0_0_0/0.85)]"

type EventView = Event & {
  _id: string
  _title: string
  _description: string
}

const normalizeEvent = (raw: any): EventView => {
  const eventId = String(raw?.eventId || raw?.id || "")
  return {
    ...raw,
    eventId,
    _id: eventId,
    _title: String(raw?.title || raw?.name || "Evento"),
    _description: String(raw?.description || ""),
  }
}

const parseLocalDateTime = (value: string): Date | null => {
  const input = String(value || "").trim()
  if (!input) return null
  const [datePart, timePart] = input.split("T")
  if (datePart && timePart) {
    const [year, month, day] = datePart.split("-").map(Number)
    const [hour, minute] = timePart.split(":").map(Number)
    if (![year, month, day, hour, minute].some((n) => Number.isNaN(n))) {
      return new Date(year, month - 1, day, hour, minute, 0, 0)
    }
  }

  // Fallback para navegadores/locales que entregan "04/28/2026 10:07 PM"
  const fallback = new Date(input)
  if (!Number.isNaN(fallback.getTime())) return fallback

  return null
}

const toLocalDateTimeInput = (date: Date) => {
  const d = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return d.toISOString().slice(0, 16)
}

const toLocalDateTimeApi = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

const toUtcDateTimeApi = (date: Date) => {
  const iso = date.toISOString()
  return `${iso.slice(0, 16)}Z`
}

const toOffsetDateTimeApi = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")
  const offsetMinutes = -date.getTimezoneOffset()
  const sign = offsetMinutes >= 0 ? "+" : "-"
  const abs = Math.abs(offsetMinutes)
  const offH = String(Math.floor(abs / 60)).padStart(2, "0")
  const offM = String(abs % 60).padStart(2, "0")
  return `${year}-${month}-${day}T${hours}:${minutes}:00${sign}${offH}:${offM}`
}

export default function EventsPage() {
  const { te } = useI18n()
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const countryCode = useLocalizedCountryCode()
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [items, setItems] = useState<EventView[]>([])
  const [fdFeed, setFdFeed] = useState<DateCard[]>([])
  const [fdLoading, setFdLoading] = useState(true)
  const [interestCard, setInterestCard] = useState<DateCard | null>(null)
  const [interestMessage, setInterestMessage] = useState("")
  const [sendingInterest, setSendingInterest] = useState(false)
  const [joinToken, setJoinToken] = useState("")
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState<string>("ALL")
  const [freeOnly, setFreeOnly] = useState<string>("ALL")
  const [joiningEventId, setJoiningEventId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [createFlow, setCreateFlow] = useState<"choose" | "meetup" | "fastdate">("choose")
  const [meetupCoords, setMeetupCoords] = useState<{ latitude: number; longitude: number } | null>(null)
  const [fastDateReload, setFastDateReload] = useState(0)
  const [isCreating, setIsCreating] = useState(false)
  const [fdCreating, setFdCreating] = useState(false)
  const [createForm, setCreateForm] = useState({
    title: "",
    description: "",
    category: "OTHER",
    startsAtDate: "",
    startsAtTime: "",
    maxGuests: "",
    officialAddress: "",
  })
  const [fdForm, setFdForm] = useState({
    title: "",
    message: "",
    dateTime: "",
    locationZone: "",
    category: "FOOD" as DateCategory,
    detail: "",
    plans: [] as Plan[],
  })

  const toggleFdPlan = (plan: Plan) =>
    setFdForm((prev) => ({
      ...prev,
      plans: prev.plans.includes(plan) ? prev.plans.filter((p) => p !== plan) : [...prev.plans, plan],
    }))

  const loadEvents = async () => {
    setIsLoading(true)
    setLoadError(false)
    try {
      console.log('[Events] Cargando eventos...')
      const filters: EventFilters = {}
      if (category !== "ALL") filters.category = category as EventCategory
      if (freeOnly === "TRUE") filters.free = true
      else if (freeOnly === "FALSE") filters.free = false
      const rows = await eventService.list(filters)
      console.log('[Events] Eventos recibidos:', rows)
      setItems((Array.isArray(rows) ? rows : []).map(normalizeEvent))
    } catch (error: any) {
      console.error('[Events] Error cargando eventos:', {
        message: error?.message,
        status: error?.status,
        details: error?.details
      })
      
      // Si es error 500, mostrar mensaje específico
      if (error?.status === 500) {
        toast.error('El servidor tiene un problema. Puede que no haya eventos creados aún o haya un error en la base de datos.')
      } else {
        toast.error(error?.message || 'Error al cargar eventos')
      }
      
      setLoadError(true)
      setItems([])
    } finally {
      setIsLoading(false)
    }
  }

  const loadFdFeed = useCallback(async () => {
    setFdLoading(true)
    try {
      const data = await fastDateService.getFeed({})
      setFdFeed(Array.isArray(data) ? data : [])
    } catch (e: unknown) {
      handleDateCardLimitError(e)
      setFdFeed([])
    } finally {
      setFdLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadEvents()
  }, [category, freeOnly])

  useEffect(() => {
    void loadFdFeed()
  }, [loadFdFeed, fastDateReload])

  useEffect(() => {
    const token = searchParams.get("token")
    if (token) setJoinToken(token)
  }, [searchParams])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter((e) =>
      e._title.toLowerCase().includes(q) ||
      e._description.toLowerCase().includes(q) ||
      String(e.category || "").toLowerCase().includes(q)
    )
  }, [items, query])

  const fdFiltered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return fdFeed
    return fdFeed.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        (c.message ?? "").toLowerCase().includes(q) ||
        c.locationZone.toLowerCase().includes(q) ||
        (c.username ?? "").toLowerCase().includes(q)
    )
  }, [fdFeed, query])

  const unifiedFeed = useMemo(() => {
    const meetups = filtered.map((event) => ({
      kind: "meetup" as const,
      sortAt: new Date(String((event as { startsAt?: string }).startsAt ?? "")).getTime() || 0,
      event,
    }))
    const fastDates = fdFiltered.map((card) => ({
      kind: "fastdate" as const,
      sortAt: new Date(card.dateTime).getTime() || 0,
      card,
    }))
    return [...meetups, ...fastDates].sort((a, b) => a.sortAt - b.sortAt)
  }, [filtered, fdFiltered])

  const exploreSummary = useMemo(() => {
    const meetups = filtered.length
    const fastDates = fdFiltered.length
    const visibleTotal = meetups + fastDates
    const meetupsOpen = filtered.filter((e) => String(e.status || "OPEN").toUpperCase() === "OPEN").length
    const meetupsWithSpots = filtered.filter((e) => {
      const max = Number(e.maxGuests || 0)
      if (!max) return true
      const approved = Number(e.currentApprovedCount || 0)
      return approved < max
    }).length
    return {
      meetups,
      fastDates,
      visibleTotal,
      meetupsOpen,
      meetupsWithSpots,
    }
  }, [filtered, fdFiltered])

  const exploreLoading = isLoading || fdLoading

  const handleJoinByLink = async () => {
    const raw = joinToken.trim()
    if (!raw) return
    const extractToken = (value: string) => {
      try {
        const url = new URL(value)
        const queryToken = url.searchParams.get("token")
        if (queryToken) return queryToken
      } catch {
        // not url
      }
      return value
    }
    const token = extractToken(raw)
    if (!token) return
    try {
      await eventService.inviteLinks.joinByToken(token)
      toast.success(te("Te uniste al evento por invitación", "You joined the event via invitation"))
      setJoinToken("")
      await loadEvents()
    } catch (error: any) {
      toast.error(error?.message || te("Could not use invitation link", "Could not use invitation link"))
    }
  }

  const handleJoinEvent = async (eventId: string) => {
    setJoiningEventId(eventId)
    try {
      await eventService.join(eventId)
      toast.success(te("Solicitud enviada", "Request sent"))
      router.push(`/events/${eventId}`)
    } catch (error: any) {
      toast.error(error?.message || te("No se pudo unir", "Could not join"))
    } finally {
      setJoiningEventId(null)
    }
  }

  const handleSendFastDateInterest = async () => {
    if (!interestCard) return
    setSendingInterest(true)
    try {
      await fastDateService.sendInterest(interestCard.id, interestMessage)
      toast.success(te("¡Interés enviado!", "Interest sent!"))
      setInterestCard(null)
      setInterestMessage("")
      await loadFdFeed()
      setFastDateReload((n) => n + 1)
    } catch (error: unknown) {
      if (!handleDateCardLimitError(error)) {
        toast.error(error instanceof Error ? error.message : te("No se pudo enviar el interés", "Could not send interest"))
      }
    } finally {
      setSendingInterest(false)
    }
  }

  const resetCreateForm = () => {
    setCreateForm({
      title: "",
      description: "",
      category: "OTHER",
      startsAtDate: "",
      startsAtTime: "",
      maxGuests: "",
      officialAddress: "",
    })
  }

  const resetWizardState = () => {
    setCreateFlow("choose")
    setMeetupCoords(null)
    setFdForm({
      title: "",
      message: "",
      dateTime: "",
      locationZone: "",
      category: "FOOD",
      detail: "",
      plans: [],
    })
    resetCreateForm()
  }

  const handleCreateFastDate = async () => {
    if (!fdForm.title || !fdForm.dateTime || !fdForm.locationZone || fdForm.plans.length === 0) {
      toast.error(te("Completa los campos obligatorios", "Complete required fields"))
      return
    }
    setFdCreating(true)
    try {
      await fastDateService.create({
        ...fdForm,
        dateTime: new Date(fdForm.dateTime).toISOString(),
        placeTypes: fdForm.plans as unknown as PlaceType[],
      })
      toast.success(te("¡Cita creada!", "Date created!"))
      setCreateOpen(false)
      resetWizardState()
      setFastDateReload((n) => n + 1)
    } catch (error) {
      if (!handleDateCardLimitError(error)) toast.error(error instanceof Error ? error.message : te("Error al crear cita", "Could not create date"))
    } finally {
      setFdCreating(false)
    }
  }

  const handleCreateEvent = async () => {
    const title = createForm.title.trim()
    const officialAddress = createForm.officialAddress.trim()
    
    if (!title) {
      toast.error(te("El título es obligatorio", "Title is required"))
      return
    }
    if (!createForm.startsAtDate || !createForm.startsAtTime) {
      toast.error(te("La fecha y hora son obligatorias", "Date and time are required"))
      return
    }
    if (!officialAddress) {
      toast.error(te("La dirección es obligatoria", "Address is required"))
      return
    }

    const startsDate = parseLocalDateTime(`${createForm.startsAtDate}T${createForm.startsAtTime}`)
    if (!startsDate) {
      toast.error(te("Fecha inválida", "Invalid date"))
      return
    }
    
    if (startsDate.getTime() <= Date.now() + 60_000) {
      toast.error(te("La fecha debe ser al menos 1 minuto en el futuro", "Date must be at least 1 minute in the future"))
      return
    }

    setIsCreating(true)
    try {
      const payload: Record<string, unknown> = {
        title,
        description: createForm.description.trim() || undefined,
        category: createForm.category,
        free: true,
        maxGuests: Number(createForm.maxGuests || 0) || undefined,
        minGuests: 1,
        minAge: 18,
        maxAge: 99,
        startsAt: toLocalDateTimeApi(startsDate),
        officialAddress,
        latitude: meetupCoords?.latitude ?? 0,
        longitude: meetupCoords?.longitude ?? 0,
      }
      
      const created = await eventService.create(payload)
      const createdId = String((created as any)?.eventId || (created as any)?.id || "")
      
      toast.success(te("¡Evento creado! Ahora configura la ubicación en Settings", "Event created! Now set location in Settings"))
      setCreateOpen(false)
      resetWizardState()
      await loadEvents()
      
      if (createdId) {
        router.push(`/events/${createdId}?tab=settings`)
      }
    } catch (error: any) {
      toast.error(error?.message || te("No se pudo crear el evento", "Could not create event"))
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      {/* Header + crear unificado */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-primary" />
            {te("Eventos y citas", "Events & dates")}
          </h1>
          <p className="text-muted-foreground text-sm">
            {te(
              "Meetups grupales y Fast Date en un solo lugar.",
              "Group meetups and Fast Date in one place."
            )}
          </p>
        </div>
        <Button
          className="h-10 shrink-0 sm:self-start"
          onClick={() => {
            resetWizardState()
            setCreateOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          {te("Crear", "Create")}
        </Button>
      </div>

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open)
          if (!open) resetWizardState()
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {createFlow === "choose"
                ? te("¿Qué quieres crear?", "What do you want to create?")
                : createFlow === "meetup"
                  ? te("Nuevo meetup", "New meetup")
                  : te("Nueva cita rápida", "New fast date")}
            </DialogTitle>
            <DialogDescription>
              {createFlow === "choose"
                ? te("Elige el tipo y verás solo los campos que aplican.", "Pick a type to see the matching fields.")
                : createFlow === "meetup"
                  ? te("Completa el meetup; la dirección va enlazada al mapa.", "Fill in the meetup; address stays linked to the map.")
                  : te("Propón una cita 1 a 1 con fecha y zona.", "Propose a 1:1 date with time and area.")}
            </DialogDescription>
          </DialogHeader>

          {createFlow !== "choose" && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="-mt-2 mb-2 h-8 gap-1 px-2 text-muted-foreground"
              onClick={() => setCreateFlow("choose")}
            >
              <ArrowLeft className="h-4 w-4" />
              {te("Otro tipo", "Other type")}
            </Button>
          )}

          {createFlow === "choose" && (
            <div className="grid gap-3 sm:grid-cols-2 pt-1">
              <button
                type="button"
                className="flex flex-col items-start gap-2 rounded-xl border border-border bg-card p-4 text-left shadow-sm transition-colors hover:border-primary/40 hover:bg-muted/40"
                onClick={() => setCreateFlow("meetup")}
              >
                <CalendarDays className="h-8 w-8 text-primary" />
                <span className="font-semibold">{te("Meetup grupal", "Group meetup")}</span>
                <span className="text-xs text-muted-foreground">
                  {te("Varios participantes, chat grupal, ubicación oficial.", "Several participants, group chat, official address.")}
                </span>
              </button>
              <button
                type="button"
                className="flex flex-col items-start gap-2 rounded-xl border border-border bg-card p-4 text-left shadow-sm transition-colors hover:border-primary/40 hover:bg-muted/40"
                onClick={() => setCreateFlow("fastdate")}
              >
                <Zap className="h-8 w-8 text-secondary" />
                <span className="font-semibold">Fast Date</span>
                <span className="text-xs text-muted-foreground">
                  {te("Cita 1 a 1 con expiración.", "One-to-one date with expiry.")}
                </span>
              </button>
            </div>
          )}

          {createFlow === "meetup" && (
            <div className="space-y-4 pt-0.5">
              <div className="space-y-1.5">
                <Label htmlFor="wizard-meetup-title" className={FORM_LABEL}>
                  {te("Título", "Title")} <span className="text-primary">*</span>
                </Label>
                <Input
                  id="wizard-meetup-title"
                  className={FORM_CONTROL_INPUT}
                  value={createForm.title}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder={te("Ej: Fiesta en la playa", "E.g. Beach party")}
                  maxLength={120}
                  autoComplete="off"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="wizard-meetup-desc" className={FORM_LABEL}>
                  {te("Descripción", "Description")}{" "}
                  <span className={FORM_LABEL_OPTIONAL_HINT}>({te("opcional", "optional")})</span>
                </Label>
                <Textarea
                  id="wizard-meetup-desc"
                  className={FORM_CONTROL_TEXTAREA}
                  value={createForm.description}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder={te("Describe tu evento...", "Describe your event...")}
                  maxLength={500}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="wizard-meetup-cat" className={FORM_LABEL}>
                  {te("Categoría", "Category")}
                </Label>
                <Select value={createForm.category} onValueChange={(value) => setCreateForm((prev) => ({ ...prev, category: value }))}>
                  <SelectTrigger id="wizard-meetup-cat" className={FORM_SELECT_TRIGGER}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {eventService.enums.categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className={FORM_LABEL}>
                  {te("Cuándo", "When")} <span className="text-primary">*</span>
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <Calendar className={WHEN_ICON} aria-hidden />
                    <Input
                      id="wizard-meetup-date"
                      type="date"
                      className={cn(FORM_CONTROL_INPUT, "pl-10")}
                      value={createForm.startsAtDate}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, startsAtDate: e.target.value }))}
                      min={new Date().toISOString().split("T")[0]}
                    />
                  </div>
                  <div className="relative">
                    <Clock className={WHEN_ICON} aria-hidden />
                    <Input
                      id="wizard-meetup-time"
                      type="time"
                      className={cn(FORM_CONTROL_INPUT, "pl-10")}
                      value={createForm.startsAtTime}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, startsAtTime: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="wizard-meetup-capacity" className={FORM_LABEL}>
                  {te("Cupos máximos", "Max guests")}{" "}
                  <span className={FORM_LABEL_OPTIONAL_HINT}>({te("opcional", "optional")})</span>
                </Label>
                <Input
                  id="wizard-meetup-capacity"
                  type="number"
                  min={1}
                  inputMode="numeric"
                  className={FORM_CONTROL_INPUT}
                  value={createForm.maxGuests}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, maxGuests: e.target.value }))}
                  placeholder={te("Vacío = ilimitado", "Empty = unlimited")}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="wizard-meetup-address" className={FORM_LABEL}>
                  {te("Dirección", "Address")} <span className="text-primary">*</span>
                </Label>
                <LocationInput
                  id="wizard-meetup-address"
                  value={createForm.officialAddress}
                  onChange={(value, coords) => {
                    setCreateForm((prev) => ({ ...prev, officialAddress: value }))
                    if (coords) setMeetupCoords({ latitude: coords.latitude, longitude: coords.longitude })
                  }}
                  placeholder={te("Buscar dirección en tu país", "Search address in your region")}
                  valueFormat="full"
                  countryCode={countryCode}
                  biasCoordinates={meetupCoords ?? undefined}
                  maxLength={280}
                />
                <AddressMapPicker
                  bootstrapCountryCode={countryCode}
                  latitude={meetupCoords?.latitude ?? null}
                  longitude={meetupCoords?.longitude ?? null}
                  onLocationChange={(c, addressLine) => {
                    setMeetupCoords({ latitude: c.latitude, longitude: c.longitude })
                    setCreateForm((prev) => ({ ...prev, officialAddress: addressLine }))
                  }}
                  labels={{
                    myLocation: te("Mi ubicación", "My location"),
                    syncHint: te(
                      "Toca el mapa o arrastra el pin; se actualiza la dirección.",
                      "Tap the map or drag the pin; the address updates."
                    ),
                    locatingGps: te("Ubicando…", "Locating…"),
                  }}
                  helperText={te(
                    "Por defecto se usa tu ubicación actual si el navegador lo permite.",
                    "Defaults to your current location when the browser allows it."
                  )}
                  className="mt-2"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  {te(
                    "Las sugerencias priorizan tu país según el idioma del navegador.",
                    "Suggestions prioritize your country based on browser locale."
                  )}
                </p>
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" className="h-10 flex-1" onClick={() => setCreateOpen(false)}>
                  {te("Cancelar", "Cancel")}
                </Button>
                <Button type="button" className="h-10 flex-1" onClick={handleCreateEvent} disabled={isCreating}>
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {te("Creando...", "Creating...")}
                    </>
                  ) : (
                    te("Crear meetup", "Create meetup")
                  )}
                </Button>
              </div>
            </div>
          )}

          {createFlow === "fastdate" && (
            <div className="space-y-4 pt-0.5">
              <div className="space-y-1.5">
                <Label htmlFor="wizard-fd-title" className={FORM_LABEL}>
                  {te("Título", "Title")} <span className="text-primary">*</span>
                </Label>
                <Input
                  id="wizard-fd-title"
                  className={FORM_CONTROL_INPUT}
                  value={fdForm.title}
                  onChange={(e) => setFdForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder={te("Ej: Café tranquilo esta tarde", "E.g. Quiet coffee this afternoon")}
                  maxLength={100}
                  autoComplete="off"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="wizard-fd-msg" className={FORM_LABEL}>
                  {te("Mensaje", "Message")}{" "}
                  <span className={FORM_LABEL_OPTIONAL_HINT}>({te("opcional", "optional")})</span>
                </Label>
                <Textarea
                  id="wizard-fd-msg"
                  value={fdForm.message}
                  onChange={(e) => setFdForm((p) => ({ ...p, message: e.target.value }))}
                  placeholder={te("Cuéntales más...", "Say more...")}
                  className={FORM_CONTROL_TEXTAREA}
                  maxLength={700}
                />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="wizard-fd-when" className={FORM_LABEL}>
                    {te("Fecha y hora", "Date & time")} <span className="text-primary">*</span>
                  </Label>
                  <div className="relative">
                    <CalendarClock className={WHEN_ICON} aria-hidden />
                    <Input
                      id="wizard-fd-when"
                      type="datetime-local"
                      className={cn(FORM_CONTROL_INPUT, "pl-10")}
                      value={fdForm.dateTime}
                      onChange={(e) => setFdForm((p) => ({ ...p, dateTime: e.target.value }))}
                      min={new Date().toISOString().slice(0, 16)}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="wizard-fd-zone" className={FORM_LABEL}>
                    {te("Zona", "Area")} <span className="text-primary">*</span>
                  </Label>
                  <Input
                    id="wizard-fd-zone"
                    className={FORM_CONTROL_INPUT}
                    value={fdForm.locationZone}
                    onChange={(e) => setFdForm((p) => ({ ...p, locationZone: e.target.value }))}
                    placeholder={te("Ej: Centro", "E.g. Downtown")}
                    autoComplete="off"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className={FORM_LABEL}>
                  {te("Categoría", "Category")} <span className="text-primary">*</span>
                </Label>
                <div className="flex flex-wrap gap-2">
                  {FD_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setFdForm((p) => ({ ...p, category: cat }))}
                      className={cn(
                        FORM_CHIP_BASE,
                        fdForm.category === cat ? FORM_CHIP_PRIMARY_ON : FORM_CHIP_IDLE
                      )}
                    >
                      {FD_CATEGORY_LABELS[cat] || cat}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label className={FORM_LABEL}>
                  {te("Planes", "Plans")}{" "}
                  <span className="text-primary">*</span>{" "}
                  <span className={FORM_LABEL_OPTIONAL_HINT}>({te("al menos uno", "at least one")})</span>
                </Label>
                <div className="flex flex-wrap gap-2">
                  {FD_PLANS.map((plan) => (
                    <button
                      key={plan}
                      type="button"
                      onClick={() => toggleFdPlan(plan)}
                      className={cn(
                        FORM_CHIP_BASE,
                        fdForm.plans.includes(plan) ? FORM_CHIP_SECONDARY_ON : FORM_CHIP_IDLE
                      )}
                    >
                      {FD_PLAN_LABELS[plan] || plan}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" className="h-10 flex-1" onClick={() => setCreateOpen(false)}>
                  {te("Cancelar", "Cancel")}
                </Button>
                <Button type="button" className="h-10 flex-1" onClick={handleCreateFastDate} disabled={fdCreating}>
                  {fdCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {te("Creando...", "Creating...")}
                    </>
                  ) : (
                    te("Crear cita", "Create date")
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="relative overflow-hidden border-border/70 bg-gradient-to-br from-card via-card to-primary/[0.08] shadow-sm ring-1 ring-primary/10">
          <CardContent className="flex gap-3 p-4 sm:p-5">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary shadow-inner">
              <Layers className="size-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {te("En esta vista", "On this screen")}
              </p>
              <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight text-foreground">
                {exploreSummary.visibleTotal}
              </p>
              <p className="mt-1.5 text-xs leading-snug text-muted-foreground">
                <span className="tabular-nums font-medium text-foreground/90">{exploreSummary.meetups}</span>{" "}
                {te("meetups", "meetups")}
                <span className="mx-1.5 text-border">·</span>
                <span className="tabular-nums font-medium text-foreground/90">{exploreSummary.fastDates}</span>{" "}
                Fast Date
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-border/70 bg-gradient-to-br from-card via-card to-emerald-500/[0.06] shadow-sm ring-1 ring-emerald-500/15">
          <CardContent className="flex gap-3 p-4 sm:p-5">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <DoorOpen className="size-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {te("Meetups abiertos", "Open meetups")}
              </p>
              <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight text-foreground">
                {exploreSummary.meetupsOpen}
              </p>
              <p className="mt-1.5 text-xs leading-snug text-muted-foreground">
                {te("Estado OPEN en el listado filtrado.", "OPEN status in your filtered list.")}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-border/70 bg-gradient-to-br from-card via-card to-amber-500/[0.07] shadow-sm ring-1 ring-amber-500/15">
          <CardContent className="flex gap-3 p-4 sm:p-5">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-700 dark:text-amber-400">
              <Users className="size-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {te("Con plaza disponible", "Spots available")}
              </p>
              <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight text-foreground">
                {exploreSummary.meetupsWithSpots}
              </p>
              <p className="mt-1.5 text-xs leading-snug text-muted-foreground">
                {te(
                  "Meetups con cupos libres o sin límite.",
                  "Meetups that still have capacity (or unlimited)."
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6 hidden">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            {te("Unirme por link de invitación", "Join by invitation link")}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={joinToken}
            onChange={(e) => setJoinToken(e.target.value)}
            placeholder={te("Pega aquí el token o URL de invitación", "Paste invitation token or URL here")}
            className={cn(FORM_CONTROL_INPUT, "flex-1")}
          />
          <Button onClick={handleJoinByLink} className="h-10 w-full shrink-0 px-4 sm:w-auto">
            {te("Unirme", "Join")}
          </Button>
        </CardContent>
      </Card>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-stretch">
        {/* Search */}
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={te("Buscar meetups y Fast Date...", "Search meetups & Fast Date...")}
            className={cn(FORM_CONTROL_INPUT, "pl-9 pr-9")}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:w-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className={cn(
                  FORM_SELECT_TRIGGER,
                  "h-10 w-full justify-between gap-2 px-3 font-normal shadow-xs sm:min-w-[220px]"
                )}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <ListFilter className="size-4 shrink-0 text-muted-foreground" />
                  <span className="truncate text-left">
                    {freeOnly === "ALL" && category === "ALL" ? (
                      te("Filtro", "Filter")
                    ) : (
                      <>
                        {freeOnly === "ALL"
                          ? te("Todos los precios", "Any price")
                          : freeOnly === "TRUE"
                            ? te("Gratis", "Free")
                            : te("Pago", "Paid")}
                        <span className="text-muted-foreground"> · </span>
                        {category === "ALL"
                          ? te("Todas las categorías", "All categories")
                          : category}
                      </>
                    )}
                  </span>
                </span>
                <ChevronDown className="size-4 shrink-0 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[min(calc(100vw-2rem),288px)] max-h-[min(70vh,420px)] overflow-y-auto">
              <DropdownMenuLabel className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {te("Precio", "Price")}
              </DropdownMenuLabel>
              <DropdownMenuRadioGroup value={freeOnly} onValueChange={setFreeOnly}>
                <DropdownMenuRadioItem value="ALL">{te("Todos", "All")}</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="TRUE">{te("Gratis", "Free")}</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="FALSE">{te("Pago", "Paid")}</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {te("Categoría", "Category")}
              </DropdownMenuLabel>
              <DropdownMenuRadioGroup value={category} onValueChange={setCategory}>
                <DropdownMenuRadioItem value="ALL">{te("Todas las categorías", "All categories")}</DropdownMenuRadioItem>
                {eventService.enums.categories.map((cat) => (
                  <DropdownMenuRadioItem key={cat} value={cat}>
                    {cat}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
              {(query || category !== "ALL" || freeOnly !== "ALL") && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-muted-foreground focus:text-foreground"
                    onClick={() => {
                      setQuery("")
                      setCategory("ALL")
                      setFreeOnly("ALL")
                    }}
                  >
                    {te("Limpiar búsqueda y filtros", "Clear search & filters")}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="mb-4 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
        <p className="flex items-center gap-2 font-medium text-foreground">
          <ShieldCheck className="h-4 w-4 text-primary" />
          {te("Seguridad meetup", "Meetup safety")}
        </p>
        <p className="mt-1">
          {te(
            "Las aprobaciones se habilitan cuando la ubicación oficial del evento coincide con la compartida en el chat grupal.",
            "Approvals are enabled when the event official location matches the one shared in group chat."
          )}
        </p>
      </div>

      {exploreLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : loadError ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-10 text-center space-y-3">
          <p className="text-sm font-medium text-foreground">
            {te("Error al cargar eventos", "Error loading events")}
          </p>
          <p className="text-sm text-muted-foreground">
            {te(
              "El servidor está teniendo problemas. Esto puede ocurrir si no hay eventos creados aún o si hay un error en la base de datos. Intenta crear un evento nuevo o contacta al administrador.",
              "The server is having issues. This may happen if there are no events created yet or if there's a database error. Try creating a new event or contact the administrator."
            )}
          </p>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" size="sm" onClick={() => void loadEvents()}>
              {te("Reintentar", "Retry")}
            </Button>
            <Button
              size="sm"
              onClick={() => {
                resetWizardState()
                setCreateOpen(true)
              }}
            >
              {te("Crear primer evento", "Create first event")}
            </Button>
          </div>
        </div>
      ) : unifiedFeed.length === 0 ? (
        <div className="rounded-xl border border-border p-10 text-center text-muted-foreground">
          {te(
            "No hay meetups ni citas rápidas que coincidan con tu búsqueda.",
            "No meetups or fast dates match your search."
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {unifiedFeed.map((item, index) => {
            if (item.kind === "fastdate") {
              return (
                <FastDateOfferCard
                  key={`fd-${item.card.id}`}
                  card={item.card}
                  currentUserId={user?.userId}
                  onInterest={() => setInterestCard(item.card)}
                  fastDateLabel={te("Fast Date", "Fast Date")}
                  interestLabel={te("Me interesa", "I'm interested")}
                  expiresLabel={te("Expira", "Expires")}
                />
              )
            }

            const event = item.event
            const available = Math.max(
              0,
              Number(event.maxGuests || 0) - Number(event.currentApprovedCount || 0)
            )
            const officialAddress = String(
              event.officialAddress || (event as any).exactAddress || ""
            ).trim()
            const zone = String(
              event.zone || (event as any).locationZone || (event as any).location_zone || ""
            ).trim()
            const sharedAddress = String((event as any).sharedAddress || "").trim()
            const backendMatched = (event as any).addressMatched
            const normalizedOfficial = officialAddress.toLowerCase().replace(/\s+/g, " ")
            const normalizedShared = sharedAddress.toLowerCase().replace(/\s+/g, " ")
            const isMatched = typeof backendMatched === "boolean"
              ? backendMatched
              : normalizedOfficial !== "" && normalizedOfficial === normalizedShared
            const locationStatus: "pending" | "matched" | "mismatch" =
              !officialAddress || !sharedAddress
                ? "pending"
                : isMatched
                  ? "matched"
                  : "mismatch"

            const locationPendingBadge =
              !officialAddress && !zone
                ? te("Sin ubicación", "No location")
                : !officialAddress && Boolean(zone)
                  ? te("Verificación pendiente", "Verification pending")
                  : officialAddress && !sharedAddress
                    ? te("Sin publicar en el chat", "Not shared in chat yet")
                    : te("Pendiente", "Pending")
            const myRole = String((event as any).myRole || "").toUpperCase()
            const canManageMeetup =
              Boolean((event as any).isAdmin) ||
              myRole === "ADMIN" ||
              myRole === "MODERATOR"
            const alreadyInEvent =
              Boolean((event as any).isMember) ||
              myRole === "ADMIN" ||
              myRole === "MODERATOR" ||
              myRole === "GUEST" ||
              String((event as any).creatorId || "") === (user?.userId ?? "__")
            const showJoinButton = !alreadyInEvent
            const actionCols = canManageMeetup
              ? showJoinButton
                ? "grid-cols-1 sm:grid-cols-3"
                : "grid-cols-1 sm:grid-cols-2"
              : showJoinButton
                ? "grid-cols-1 sm:grid-cols-2"
                : "grid-cols-1"
            const eventKey = event._id || `${event._title}-${String((event as any).startsAt || "")}-${index}`
            const creatorPhoto = String(event.creatorProfilePictureUrl || "").trim()
            const creatorUsername = String(event.creatorUsername || "").trim()
            const creatorId = String(event.creatorId || "").trim()
            const openCreatorProfile = () => {
              if (creatorId) router.push(`/profile/${creatorId}`)
            }
            const placeLabel =
              officialAddress || zone || te("Por definir", "To be confirmed")
            return (
              <Card
                key={eventKey}
                className={cn(
                  "gap-0 overflow-hidden py-0 shadow-sm transition-colors hover:border-primary/45 hover:shadow-md",
                  "border-l-[5px] border-l-primary bg-gradient-to-br from-card to-primary/[0.06] ring-1 ring-primary/15"
                )}
              >
                <CardContent className="space-y-4 px-5 pb-5 pt-5">
                  {/* Cabecera: avatar + tipo + usuario | título + estado */}
                  <div className="flex gap-3">
                    {creatorId ? (
                      <button
                        type="button"
                        onClick={openCreatorProfile}
                        className="shrink-0 rounded-full ring-offset-background transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                      >
                        <Avatar className="size-14 border-2 border-primary/25">
                          <AvatarImage src={creatorPhoto || undefined} alt="" />
                          <AvatarFallback className="bg-primary/10 text-base font-semibold text-primary">
                            {creatorUsername?.[0]?.toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                      </button>
                    ) : (
                      <Avatar className="size-14 shrink-0 border-2 border-primary/25">
                        <AvatarImage src={creatorPhoto || undefined} alt="" />
                        <AvatarFallback className="bg-primary/10 text-base font-semibold text-primary">
                          {creatorUsername?.[0]?.toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className="gap-1 border-0 bg-primary/15 text-primary">
                          <Users className="size-3" aria-hidden />
                          {te("Meetup grupal", "Group meetup")}
                        </Badge>
                        {creatorUsername ? (
                          creatorId ? (
                            <button
                              type="button"
                              onClick={openCreatorProfile}
                              className="truncate text-xs font-semibold text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                            >
                              @{creatorUsername}
                            </button>
                          ) : (
                            <span className="truncate text-xs font-semibold text-muted-foreground">
                              @{creatorUsername}
                            </span>
                          )
                        ) : null}
                      </div>
                      <div className="flex items-start justify-between gap-3">
                        <CardTitle className="text-lg leading-snug">{event._title}</CardTitle>
                        <Badge
                          variant="outline"
                          className={cn(
                            "shrink-0",
                            String(event.status || "OPEN").toUpperCase() === "OPEN"
                              ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                              : ""
                          )}
                        >
                          {event.status || "OPEN"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm leading-relaxed text-muted-foreground line-clamp-3">
                    {event._description?.trim()
                      ? event._description
                      : te("Sin descripción", "No description")}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {event.category && (
                      <Badge variant="secondary" className="border-0 bg-muted font-normal">
                        {event.category}
                      </Badge>
                    )}
                    {event.free === true && (
                      <Badge className="border-0 bg-green-500/15 text-green-600 dark:text-green-400">
                        {te("Gratis", "Free")}
                      </Badge>
                    )}
                    {event.free === false && (
                      <Badge className="border-0 bg-amber-500/15 text-amber-700 dark:text-amber-400">
                        {te("Pago", "Paid")}
                      </Badge>
                    )}
                  </div>

                  <div
                    className={cn(
                      "flex min-w-0 flex-col gap-2 rounded-xl border px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3",
                      locationStatus === "matched"
                        ? "border-emerald-500/25 bg-emerald-500/[0.07]"
                        : locationStatus === "mismatch"
                          ? "border-rose-500/25 bg-rose-500/[0.07]"
                          : "border-amber-500/25 bg-amber-500/[0.07]"
                    )}
                  >
                    <p className="min-w-0 text-xs leading-snug sm:text-sm">
                      <span className="font-semibold text-foreground">
                        {te("Ubicación del evento:", "Event location:")}
                      </span>{" "}
                      <span className="break-words text-muted-foreground">{placeLabel}</span>
                    </p>
                    <Badge
                      className={cn(
                        "w-fit shrink-0 border-0 text-[10px]",
                        locationStatus === "matched"
                          ? "bg-emerald-600/20 text-emerald-700 dark:text-emerald-400"
                          : locationStatus === "mismatch"
                            ? "bg-rose-600/20 text-rose-700 dark:text-rose-400"
                            : "bg-amber-600/20 text-amber-800 dark:text-amber-400"
                      )}
                    >
                      {locationStatus === "matched"
                        ? te("Verificada", "Verified")
                        : locationStatus === "mismatch"
                          ? te("No coincide", "Mismatch")
                          : locationPendingBadge}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-x-5 gap-y-2 border-t border-border/60 pt-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-2">
                      <Users className="size-4 shrink-0 opacity-80" aria-hidden />
                      <span>
                        <span className="tabular-nums font-medium text-foreground">
                          {event.currentApprovedCount || 0}/{event.maxGuests || "∞"}
                        </span>{" "}
                        {te("participantes", "participants")}
                      </span>
                    </span>
                    <span className="flex items-center gap-2">
                      <MapPin className="size-4 shrink-0 opacity-80" aria-hidden />
                      <span>
                        {te("Cupos", "Spots")}:{" "}
                        <span className="font-medium text-foreground tabular-nums">
                          {event.maxGuests ? available : te("Ilimitado", "Unlimited")}
                        </span>
                      </span>
                    </span>
                  </div>

                  <div className={`grid gap-2 pt-1 ${actionCols}`}>
                    <Button
                      variant="outline"
                      className="h-10 w-full"
                      onClick={() => router.push(`/events/${event._id}`)}
                    >
                      {te("Ver detalle", "View details")}
                    </Button>
                    {canManageMeetup && (
                      <Button
                        variant="secondary"
                        className="h-10 w-full"
                        onClick={() => router.push(`/events/${event._id}?tab=settings`)}
                      >
                        {te("Configurar meetup", "Configure meetup")}
                      </Button>
                    )}
                    {showJoinButton && (
                      <Button
                        className="h-10 w-full"
                        onClick={() => handleJoinEvent(event._id)}
                        disabled={joiningEventId === event._id}
                      >
                        {joiningEventId === event._id ? te("Uniendo...", "Joining...") : te("Unirme", "Join")}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <div className="mt-10 border-t border-border pt-8">
        <FastDateSection
          hidePublicFeed
          suppressInlineCreate
          reloadToken={fastDateReload}
          onRequestCreate={() => {
            resetWizardState()
            setCreateOpen(true)
          }}
        />
      </div>

      <Dialog open={!!interestCard} onOpenChange={(open) => !open && setInterestCard(null)}>
        <DialogContent className="max-w-sm border-border bg-card">
          <DialogHeader>
            <DialogTitle>{te("Enviar interés", "Send interest")}</DialogTitle>
          </DialogHeader>
          {interestCard && (
            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-muted/50 p-3">
                <p className="text-sm font-semibold">{interestCard.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {interestCard.locationZone}
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="events-fd-interest-msg" className={FORM_LABEL}>
                  {te("Tu mensaje", "Your message")}
                </Label>
                <Textarea
                  id="events-fd-interest-msg"
                  value={interestMessage}
                  onChange={(e) => setInterestMessage(e.target.value)}
                  placeholder={te("Preséntate...", "Introduce yourself...")}
                  className={FORM_CONTROL_TEXTAREA}
                  maxLength={300}
                />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setInterestCard(null)}>
                  {te("Cancelar", "Cancel")}
                </Button>
                <Button
                  className="flex-1 bg-gradient-to-r from-primary to-secondary font-bold text-black"
                  onClick={() => void handleSendFastDateInterest()}
                  disabled={sendingInterest}
                >
                  {sendingInterest ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Heart className="mr-1 h-4 w-4" />
                  )}
                  {te("Enviar", "Send")}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

