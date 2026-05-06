"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { eventService } from "@/lib/services/event"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { LocationInput } from "@/components/ui/location-input"
import { CalendarDays, Link2, Loader2, MapPin, Plus, ShieldCheck, SlidersHorizontal, Users, Zap } from "lucide-react"
import type { Event } from "@/lib/types"
import { toast } from "sonner"
import { useI18n } from "@/lib/i18n"
import { useAuth } from "@/lib/auth-context"
import { FastDateSection } from "@/components/events/fast-date-section"

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
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [items, setItems] = useState<EventView[]>([])
  const [mainTab, setMainTab] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      return params.get('tab') === 'fastdate' ? 'fastdate' : 'events'
    }
    return 'events'
  })
  const [joinToken, setJoinToken] = useState("")
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState<string>("ALL")
  const [freeOnly, setFreeOnly] = useState<string>("ALL")
  const [joiningEventId, setJoiningEventId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [createForm, setCreateForm] = useState({
    title: "",
    description: "",
    category: "OTHER",
    free: true,
    price: "",
    minGuests: "",
    maxGuests: "",
    minAge: "18",
    maxAge: "99",
    startsAt: "",
    endsAt: "",
    officialAddress: "",
  })

  const loadEvents = async () => {
    setIsLoading(true)
    setLoadError(false)
    try {
      const rows = await eventService.list({
        category: category !== "ALL" ? (category as any) : undefined,
        free: freeOnly === "ALL" ? undefined : freeOnly === "TRUE",
      })
      setItems((Array.isArray(rows) ? rows : []).map(normalizeEvent))
    } catch {
      setLoadError(true)
      setItems([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadEvents()
  }, [category, freeOnly])

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

  const quickStats = useMemo(() => {
    const total = filtered.length
    const open = filtered.filter((e) => String(e.status || "OPEN").toUpperCase() === "OPEN").length
    const withSpots = filtered.filter((e) => {
      const max = Number(e.maxGuests || 0)
      if (!max) return true
      const approved = Number(e.currentApprovedCount || 0)
      return approved < max
    }).length
    return { total, open, withSpots }
  }, [filtered])

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

  const resetCreateForm = () => {
    setCreateForm({
      title: "",
      description: "",
      category: "OTHER",
      free: true,
      price: "",
      minGuests: "",
      maxGuests: "",
      minAge: "18",
      maxAge: "99",
      startsAt: "",
      endsAt: "",
      officialAddress: "",
    })
  }

  const handleCreateEvent = async () => {
    const title = createForm.title.trim()
    const officialAddress = createForm.officialAddress.trim()
    if (!title) {
      toast.error(te("El título es obligatorio", "Title is required"))
      return
    }
    if (!officialAddress) {
      toast.error(te("La dirección oficial es obligatoria", "Official address is required"))
      return
    }

    const startsDate = parseLocalDateTime(createForm.startsAt)
    const endsDate = parseLocalDateTime(createForm.endsAt)
    const now = Date.now()

    if (!startsDate) {
      toast.error(te("La fecha de inicio es obligatoria", "Start date is required"))
      return
    }
    if (startsDate.getTime() <= now + 60_000) {
      toast.error(
        te(
          "La fecha de inicio debe ser al menos 1 minuto en el futuro",
          "Start date must be at least 1 minute in the future"
        )
      )
      return
    }
    if (createForm.endsAt && !endsDate) {
      toast.error(te("La fecha de fin no es válida", "End date is not valid"))
      return
    }
    if (startsDate && endsDate && endsDate <= startsDate) {
      toast.error(te("La fecha de fin debe ser mayor que la de inicio", "End time must be after start time"))
      return
    }

    setIsCreating(true)
    try {
      const maxGuestsValue = Number(createForm.maxGuests || 0)
      const minGuestsValue = Number(createForm.minGuests || 1)
      const minAgeValue = Number(createForm.minAge || 18)
      const maxAgeValue = Number(createForm.maxAge || 99)
      const priceValue = !createForm.free ? Number(createForm.price || 0) : undefined
      const basePayload: Record<string, unknown> = {
        title,
        description: createForm.description.trim() || undefined,
        category: createForm.category as any,
        free: createForm.free,
        price: priceValue,
        minGuests: minGuestsValue > 0 ? minGuestsValue : 1,
        maxGuests: maxGuestsValue > 0 ? maxGuestsValue : undefined,
        minAge: minAgeValue,
        maxAge: maxAgeValue,
        startsAt: toLocalDateTimeApi(startsDate),
        startAt: toLocalDateTimeApi(startsDate),
        startDateTime: toLocalDateTimeApi(startsDate),
        dateTime: toLocalDateTimeApi(startsDate),
        endsAt: endsDate ? toLocalDateTimeApi(endsDate) : undefined,
        endAt: endsDate ? toLocalDateTimeApi(endsDate) : undefined,
        endDateTime: endsDate ? toLocalDateTimeApi(endsDate) : undefined,
        officialAddress,
      }
      let created: any
      try {
        created = await eventService.create(basePayload)
      } catch (error: any) {
        const message = String(error?.message || "").toLowerCase()
        const looksLikeFutureValidation =
          message.includes("future") ||
          message.includes("futura") ||
          message.includes("must be")

        if (!looksLikeFutureValidation) {
          throw error
        }

        const offsetPayload: Record<string, unknown> = {
          ...basePayload,
          startsAt: toOffsetDateTimeApi(startsDate),
          startAt: toOffsetDateTimeApi(startsDate),
          startDateTime: toOffsetDateTimeApi(startsDate),
          dateTime: toOffsetDateTimeApi(startsDate),
          endsAt: endsDate ? toOffsetDateTimeApi(endsDate) : undefined,
          endAt: endsDate ? toOffsetDateTimeApi(endsDate) : undefined,
          endDateTime: endsDate ? toOffsetDateTimeApi(endsDate) : undefined,
        }
        try {
          created = await eventService.create(offsetPayload)
        } catch {
          const utcPayload: Record<string, unknown> = {
            ...basePayload,
            startsAt: toUtcDateTimeApi(startsDate),
            startAt: toUtcDateTimeApi(startsDate),
            startDateTime: toUtcDateTimeApi(startsDate),
            dateTime: toUtcDateTimeApi(startsDate),
            endsAt: endsDate ? toUtcDateTimeApi(endsDate) : undefined,
            endAt: endsDate ? toUtcDateTimeApi(endsDate) : undefined,
            endDateTime: endsDate ? toUtcDateTimeApi(endsDate) : undefined,
          }
          created = await eventService.create(utcPayload)
        }
      }
      const createdId = String((created as any)?.eventId || (created as any)?.id || "")
      toast.success(te("Evento creado", "Event created"))
      setCreateOpen(false)
      resetCreateForm()
      await loadEvents()
      if (createdId) {
        router.push(`/events/${createdId}`)
      }
    } catch (error: any) {
      const details = String(error?.details || "").trim()
      const msg = String(error?.message || "").trim()
      toast.error(details ? `${msg} — ${details}` : (msg || te("No se pudo crear el evento", "Could not create event")))
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      {/* Header con selector principal */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            {mainTab === 'events' ? <CalendarDays className="h-6 w-6 text-primary" /> : <Zap className="h-6 w-6 text-primary" />}
            {mainTab === 'events' ? te("Eventos", "Events") : "Fast Date"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {mainTab === 'events' ? te("Explora eventos y su chat grupal en tiempo real.", "Explore events and their real-time group chat.") : "Citas 1 a 1 con expiración"}
          </p>
        </div>
      </div>

      {/* Selector de sección */}
      <div className="flex gap-2 mb-6 p-1 bg-muted rounded-xl w-fit">
        <button
          onClick={() => setMainTab('events')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            mainTab === 'events' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <CalendarDays className="h-4 w-4" />{te("Eventos", "Events")}
        </button>
        <button
          onClick={() => setMainTab('fastdate')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            mainTab === 'fastdate' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Zap className="h-4 w-4" />Fast Date
        </button>
      </div>

      {/* Fast Date */}
      {mainTab === 'fastdate' && <FastDateSection />}

      {/* Eventos */}
      {mainTab === 'events' && (<>
      <div className="mb-4 flex justify-end">
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="h-10 w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              {te("Crear evento", "Create event")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{te("Crear evento", "Create event")}</DialogTitle>
              <DialogDescription>
                {te("Completa los datos del meetup y guarda.", "Fill meetup details and save.")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">{te("Título", "Title")} *</label>
                <Input
                  className="mt-1"
                  value={createForm.title}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder={te("Ej: Meetup de networking", "E.g. Networking meetup")}
                  maxLength={120}
                />
              </div>
              <div>
                <label className="text-sm font-medium">{te("Descripción", "Description")}</label>
                <Textarea
                  className="mt-1 min-h-20 resize-none"
                  value={createForm.description}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder={te("Describe tu evento", "Describe your event")}
                  maxLength={800}
                />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">{te("Categoría", "Category")}</label>
                  <Select value={createForm.category} onValueChange={(value) => setCreateForm((prev) => ({ ...prev, category: value }))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {eventService.enums.categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">{te("Tipo", "Type")}</label>
                  <Select
                    value={createForm.free ? "TRUE" : "FALSE"}
                    onValueChange={(value) => setCreateForm((prev) => ({ ...prev, free: value === "TRUE" }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TRUE">{te("Gratis", "Free")}</SelectItem>
                      <SelectItem value="FALSE">{te("Pago", "Paid")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">{te("Inicio", "Start")}</label>
                  <Input
                    type="datetime-local"
                    className="mt-1"
                    value={createForm.startsAt}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, startsAt: e.target.value }))}
                    min={toLocalDateTimeInput(new Date(Date.now() + 60_000))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">{te("Fin", "End")}</label>
                  <Input
                    type="datetime-local"
                    className="mt-1"
                    value={createForm.endsAt}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, endsAt: e.target.value }))}
                    min={createForm.startsAt || toLocalDateTimeInput(new Date(Date.now() + 120_000))}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">{te("Cupos máximos", "Max guests")}</label>
                <Input
                  type="number"
                  min={1}
                  className="mt-1"
                  value={createForm.maxGuests}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, maxGuests: e.target.value }))}
                  placeholder={te("Opcional (si vacío = ilimitado)", "Optional (empty = unlimited)")}
                />
              </div>
              {!createForm.free && (
                <div>
                  <label className="text-sm font-medium">{te("Precio", "Price")}</label>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    className="mt-1"
                    value={createForm.price}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, price: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">{te("Cupos mínimos", "Min guests")}</label>
                  <Input
                    type="number"
                    min={1}
                    className="mt-1"
                    value={createForm.minGuests}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, minGuests: e.target.value }))}
                    placeholder="1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">{te("Cupos máximos", "Max guests")}</label>
                  <Input
                    type="number"
                    min={1}
                    className="mt-1"
                    value={createForm.maxGuests}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, maxGuests: e.target.value }))}
                    placeholder={te("Ilimitado", "Unlimited")}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">{te("Edad mínima", "Min age")}</label>
                  <Input
                    type="number"
                    min={18}
                    max={99}
                    className="mt-1"
                    value={createForm.minAge}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, minAge: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">{te("Edad máxima", "Max age")}</label>
                  <Input
                    type="number"
                    min={18}
                    max={99}
                    className="mt-1"
                    value={createForm.maxAge}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, maxAge: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">{te("Dirección oficial meetup", "Official meetup address")} *</label>
                <LocationInput
                  className="mt-1"
                  value={createForm.officialAddress}
                  onChange={(value) => setCreateForm((prev) => ({ ...prev, officialAddress: value }))}
                  placeholder={te("Dirección exacta para validación de seguridad", "Exact address for safety validation")}
                  valueFormat="full"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  {te("Escribe al menos 3 caracteres para ver sugerencias", "Type at least 3 characters to see suggestions")}
                </p>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" className="h-10 flex-1" onClick={() => setCreateOpen(false)}>
                  {te("Cancelar", "Cancel")}
                </Button>
                <Button type="button" className="h-10 flex-1" onClick={handleCreateEvent} disabled={isCreating}>
                  {isCreating ? te("Creando...", "Creating...") : te("Crear evento", "Create event")}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Card className="border-border/70">
          <CardContent className="py-4">
            <p className="text-xs text-muted-foreground">{te("Mostrando", "Showing")}</p>
            <p className="text-xl font-semibold text-foreground">{quickStats.total}</p>
          </CardContent>
        </Card>
        <Card className="border-border/70">
          <CardContent className="py-4">
            <p className="text-xs text-muted-foreground">{te("Abiertos", "Open")}</p>
            <p className="text-xl font-semibold text-foreground">{quickStats.open}</p>
          </CardContent>
        </Card>
        <Card className="border-border/70">
          <CardContent className="py-4">
            <p className="text-xs text-muted-foreground">{te("Con cupos", "With spots")}</p>
            <p className="text-xl font-semibold text-foreground">{quickStats.withSpots}</p>
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
          />
          <Button onClick={handleJoinByLink} className="h-10 w-full shrink-0 px-4 sm:w-auto">
            {te("Unirme", "Join")}
          </Button>
        </CardContent>
      </Card>

      <div className="mb-4 space-y-3">
        {/* Search */}
        <div className="relative">
          <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={te("Buscar eventos...", "Search events...")}
            className="pl-9 pr-9 h-11 bg-muted/40 border-border/60 focus:bg-background"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          )}
        </div>

        {/* Chips gratis/pago */}
        <div className="flex items-center gap-2 flex-wrap">
          {(["ALL", "TRUE", "FALSE"] as const).map((val) => (
            <button
              key={val}
              onClick={() => setFreeOnly(val)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                freeOnly === val
                  ? "bg-primary text-black border-primary shadow-sm"
                  : "bg-muted/40 text-muted-foreground border-border/60 hover:border-primary/40 hover:text-foreground"
              }`}
            >
              {val === "ALL" ? te("Todos", "All") : val === "TRUE" ? te("Gratis", "Free") : te("Pago", "Paid")}
            </button>
          ))}
          <div className="w-px h-4 bg-border/60 mx-1" />
          {/* Chips categoría */}
          {(["ALL", ...eventService.enums.categories] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                category === cat
                  ? "bg-secondary text-black border-secondary shadow-sm"
                  : "bg-muted/40 text-muted-foreground border-border/60 hover:border-secondary/40 hover:text-foreground"
              }`}
            >
              {cat === "ALL" ? te("Todas", "All categories") : cat}
            </button>
          ))}
          {(query || category !== "ALL" || freeOnly !== "ALL") && (
            <button
              onClick={() => { setQuery(""); setCategory("ALL"); setFreeOnly("ALL") }}
              className="ml-auto text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
            >
              {te("Limpiar", "Clear")}
            </button>
          )}
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

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : loadError ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-10 text-center space-y-3">
          <p className="text-sm text-muted-foreground">
            {te("No se pudieron cargar los eventos. El servidor puede estar iniciando.", "Could not load events. The server may be starting up.")}
          </p>
          <Button variant="outline" size="sm" onClick={() => void loadEvents()}>
            {te("Reintentar", "Retry")}
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border p-10 text-center text-muted-foreground">
          {te("No hay eventos con esos filtros.", "No events found with those filters.")}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((event, index) => {
            const available = Math.max(
              0,
              Number(event.maxGuests || 0) - Number(event.currentApprovedCount || 0)
            )
            const officialAddress = String((event as any).officialAddress || "").trim()
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
            return (
              <Card key={eventKey} className="hover:border-primary/40 transition-colors shadow-sm">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg">{event._title}</CardTitle>
                    <Badge
                      variant="outline"
                      className={
                        String(event.status || "OPEN").toUpperCase() === "OPEN"
                          ? "border-emerald-500/30 text-emerald-500"
                          : ""
                      }
                    >
                      {event.status || "OPEN"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{event._description || te("Sin descripción", "No description")}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {event.category && <Badge className="bg-primary/10 text-primary border-0">{event.category}</Badge>}
                    {event.free === true && <Badge className="bg-green-500/15 text-green-500 border-0">{te("Gratis", "Free")}</Badge>}
                    {event.free === false && <Badge className="bg-amber-500/15 text-amber-500 border-0">{te("Pago", "Paid")}</Badge>}
                    <Badge
                      className={
                        locationStatus === "matched"
                          ? "bg-emerald-500/15 text-emerald-500 border-0"
                          : locationStatus === "mismatch"
                            ? "bg-rose-500/15 text-rose-500 border-0"
                            : "bg-amber-500/15 text-amber-500 border-0"
                      }
                    >
                      {locationStatus === "matched"
                        ? te("Ubicación OK", "Location OK")
                        : locationStatus === "mismatch"
                          ? te("Ubicación no coincide", "Location mismatch")
                          : te("Ubicación pendiente", "Location pending")}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {event.currentApprovedCount || 0}/{event.maxGuests || "∞"} {te("participantes", "participants")}
                    </p>
                    <p className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {te("Cupos", "Spots")}: {event.maxGuests ? available : te("Ilimitado", "Unlimited")}
                    </p>
                  </div>
                  <div className={`grid gap-2 ${actionCols}`}>
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
      </>)}
    </div>
  )
}

