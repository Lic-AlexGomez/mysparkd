"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { eventService } from "@/lib/services/event"
import { recordJoinMeetup } from "@/lib/services/moments"
import { activityFeedService } from "@/lib/services/activity-feed"
import type { UnifiedFeedItem } from "@/lib/services/activity-feed"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  Plus,
  Search,
  ShieldCheck,
  Users,
  Zap,
} from "lucide-react"
import type {
  DateCard,
  DateCategory,
  Event,
  EventCategory,
  EventFilters,
  MyDateCard,
  Plan,
  PlaceType,
} from "@/lib/types"
import { toast } from "sonner"
import { useI18n } from "@/lib/i18n"
import { useAuth } from "@/lib/auth-context"
import { FastDateSection } from "@/components/events/fast-date-section"
import { FastDateOfferCard } from "@/components/events/fast-date-offer-card"
import { MeetupOfferCard } from "@/components/events/meetup-offer-card"
import { AddressMapPicker } from "@/components/ui/address-map-picker"
import {
  fastDateService,
  mergeDateCardFeedWithMine,
  enrichDateCardsOutsideFeed,
} from "@/lib/services/fastdate"
import { handleDateCardLimitError } from "@/lib/errors/date-card-limits"
import { useLocalizedCountryCode } from "@/hooks/use-localized-country-code"
import { useExperienceMode } from "@/hooks/use-experience-mode"
import { computeAgeFromDateOfBirth } from "@/lib/utils"
import { NearbyActivityLayer } from "@/components/activity/nearby-activity-layer"
import { CityPulseIndicator } from "@/components/city/city-pulse-indicator"
import { useCityPulse } from "@/hooks/use-city-pulse"
import { ActivityCoreStreamStrip } from "@/components/activity/activity-core-stream-strip"
import type { ActivityCoreExperienceMode } from "@/lib/types/activity-core-stream"

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
  const zoneNorm = String(
    raw?.zone ?? raw?.locationZone ?? raw?.location_zone ?? ""
  ).trim()
  const officialNorm = String(
    raw?.officialAddress ?? raw?.official_address ?? ""
  ).trim()
  const photoNorm = String(
    raw?.creatorProfilePictureUrl ?? raw?.creatorPhotoUrl ?? ""
  ).trim()

  const base: Record<string, unknown> = {
    ...raw,
    eventId,
    _id: eventId,
    _title: String(raw?.title || raw?.name || "Evento"),
    _description: String(raw?.description ?? ""),
  }
  if (zoneNorm) {
    base.zone = zoneNorm
    base.locationZone = zoneNorm
  }
  if (officialNorm) base.officialAddress = officialNorm
  if (photoNorm) base.creatorProfilePictureUrl = photoNorm

  return base as unknown as EventView
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

type ExploreFilter = "all" | "meetup" | "fastdate"

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
  const { te, language } = useI18n()
  const { user } = useAuth()
  const experienceMode = useExperienceMode()
  const router = useRouter()
  const pathname = usePathname()
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
  /** Meetups vienen de `/api/activity-feed` (solo tipo MEETUP). Fast Date de `fastDateService.getFeed`. */
  const [contentFilter, setContentFilter] = useState<ExploreFilter>("all")
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
    /** Si es false, se envía `free: false` y `price` al backend. */
    meetupFree: true,
    meetupPrice: "",
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

  const [pulseCoords, setPulseCoords] = useState<{ lat: number; lng: number } | null>(null)
  useEffect(() => {
    if (meetupCoords?.latitude != null && meetupCoords?.longitude != null) {
      setPulseCoords({ lat: meetupCoords.latitude, lng: meetupCoords.longitude })
      return
    }
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem("sparkd_location") : null
      if (!raw) return
      const j = JSON.parse(raw) as { latitude?: number; longitude?: number }
      if (typeof j.latitude === "number" && typeof j.longitude === "number") {
        setPulseCoords({ lat: j.latitude, lng: j.longitude })
      }
    } catch {
      /* ignore */
    }
  }, [meetupCoords])

  const { pulse: cityPulse, loading: cityPulseLoading } = useCityPulse({
    lat: pulseCoords?.lat,
    lng: pulseCoords?.lng,
    enabled:
      Boolean(pulseCoords) && (experienceMode === "SOCIAL" || experienceMode === "BOTH"),
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
      const filter: Record<string, any> = { sort: 'NEWER' }
      if (category !== "ALL") filter.eventCategory = category
      if (freeOnly === "TRUE") filter.free = true
      else if (freeOnly === "FALSE") filter.free = false

      const rows = await activityFeedService.getFeed(filter)
      const all = Array.isArray(rows) ? rows : []

      setItems(all
        .filter((item: UnifiedFeedItem) => item.type === 'MEETUP')
        .map((item: UnifiedFeedItem) => {
          const row = item as UnifiedFeedItem & Record<string, unknown>
          const pickStr = (...keys: string[]) => {
            for (const k of keys) {
              const v = row[k]
              if (typeof v === 'string' && v.trim()) return v.trim()
            }
            return ''
          }
          const zoneStr =
            String(item.locationZone ?? "").trim() ||
            String(item.zone ?? "").trim() ||
            pickStr("location_zone")
          const officialStr = pickStr(
            'officialAddress',
            'official_address',
            'exactAddress',
            'exact_address',
            'address'
          )
          const creatorUser =
            pickStr('creatorUsername', 'creator_username') ||
            item.creatorUsername?.trim() ||
            ''
          const creatorPic =
            pickStr(
              'creatorPhotoUrl',
              'creator_photo_url',
              'creatorProfilePictureUrl',
              'creator_profile_picture_url'
            ) || item.creatorPhotoUrl?.trim()

          return normalizeEvent({
            eventId: item.id,
            startsAt: item.dateTime,
            title: item.title,
            description: item.description,
            category: item.category,
            status: item.status || 'OPEN',
            free: item.free ?? true,
            price: item.price,
            maxGuests: item.maxGuests || 0,
            currentApprovedCount: item.currentApprovedCount || 0,
            coverPhotoUrl: item.coverPhotoUrl,
            creatorId: item.creatorId,
            creatorUsername: creatorUser || item.creatorUsername,
            creatorProfilePictureUrl: creatorPic,
            full: item.full ?? false,
            zone: zoneStr || item.zone,
            locationZone: zoneStr || item.locationZone,
            officialAddress: officialStr || item.officialAddress,
          })
        })
      )

      setFdFeed(all.filter((item: UnifiedFeedItem) => item.type === 'DATE') as any)
    } catch (error: any) {
      if (error?.status === 500) {
        toast.error('El servidor tiene un problema.')
      } else {
        toast.error(error?.message || 'Error al cargar')
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
      let feed: DateCard[] = []
      try {
        const data = await fastDateService.getFeed({})
        feed = Array.isArray(data) ? data : []
      } catch (e: unknown) {
        handleDateCardLimitError(e)
        feed = []
      }

      let mine: MyDateCard[] = []
      if (user?.userId) {
        try {
          const m = await fastDateService.getMine()
          mine = Array.isArray(m) ? m : []
        } catch {
          mine = []
        }
      }

      const displayName = [user?.nombres, user?.apellidos].filter(Boolean).join(" ").trim()
      const viewerAge = computeAgeFromDateOfBirth(user?.dateOfBirth) ?? undefined
      const viewer = {
        userId: user?.userId ?? "",
        username: user?.username,
        profilePictureUrl: user?.profilePictureUrl,
        displayName: displayName || undefined,
        viewerAge,
      }
      const feedIds = new Set(feed.map((c) => String(c.id)))
      const merged = mergeDateCardFeedWithMine(feed, mine, viewer)
      const enriched = await enrichDateCardsOutsideFeed(merged, feedIds, viewer)
      setFdFeed(enriched)
    } finally {
      setFdLoading(false)
    }
  }, [
    user?.userId,
    user?.username,
    user?.profilePictureUrl,
    user?.nombres,
    user?.apellidos,
    user?.dateOfBirth,
  ])

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

  const applyContentFilter = useCallback(
    (next: ExploreFilter) => {
      setContentFilter(next)
      const params = new URLSearchParams(searchParams.toString())
      if (next === "all") {
        params.delete("explore")
      } else {
        params.set("explore", next)
      }
      const qs = params.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [pathname, router, searchParams]
  )

  /** Deep links / shared URLs: ?explore=meetup|fastdate|all */
  useEffect(() => {
    const v = searchParams.get("explore")
    if (v === "meetup" || v === "fastdate" || v === "all") {
      setContentFilter(v)
    }
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

  const displayedFeed = useMemo(() => {
    if (contentFilter === "meetup") return unifiedFeed.filter((i) => i.kind === "meetup")
    if (contentFilter === "fastdate") return unifiedFeed.filter((i) => i.kind === "fastdate")
    return unifiedFeed
  }, [unifiedFeed, contentFilter])

  const exploreSummary = useMemo(() => {
    const meetupEvents = displayedFeed.filter((i) => i.kind === "meetup").map((i) => i.event)
    const meetups = meetupEvents.length
    const fastDates = displayedFeed.filter((i) => i.kind === "fastdate").length
    const visibleTotal = displayedFeed.length
    const meetupsOpen = meetupEvents.filter((e) => String(e.status || "OPEN").toUpperCase() === "OPEN").length
    const meetupsWithSpots = meetupEvents.filter((e) => {
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
  }, [displayedFeed])

  const exploreLoading =
    (contentFilter !== "fastdate" && isLoading) || (contentFilter !== "meetup" && fdLoading)

  const showFastDateManageSection =
    contentFilter !== "meetup" && experienceMode !== "SOCIAL"

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
      const ev = items.find((i) => i._id === eventId || i.eventId === eventId)
      recordJoinMeetup({
        eventId,
        eventTitle: ev?._title,
        zone: ev?.zone || ev?.locationZone,
        user: user
          ? {
              userId: String(user.userId),
              username: user.username,
              profilePictureUrl: user.profilePictureUrl,
            }
          : undefined,
      })
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
      meetupFree: true,
      meetupPrice: "",
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
      await loadFdFeed()
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

    let free = createForm.meetupFree
    let price: number | undefined
    if (!createForm.meetupFree) {
      const raw = createForm.meetupPrice.trim().replace(",", ".")
      const n = Number(raw)
      if (!Number.isFinite(n) || n <= 0) {
        toast.error(
          te("Indica un precio mayor que cero para entrada de pago.", "Enter a price greater than zero for paid entry.")
        )
        return
      }
      free = false
      price = n
    }

    setIsCreating(true)
    try {
      const payload: Record<string, unknown> = {
        title,
        description: createForm.description.trim() || undefined,
        category: createForm.category,
        free,
        ...(price !== undefined ? { price } : {}),
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

      {(experienceMode === "SOCIAL" || experienceMode === "BOTH") && <NearbyActivityLayer context="events" />}

      {(experienceMode === "SOCIAL" || experienceMode === "BOTH") && pulseCoords && (
        <CityPulseIndicator
          pulse={cityPulse}
          loading={cityPulseLoading}
          te={te}
          className="mt-4"
        />
      )}

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
              <div className="space-y-2">
                <Label className={FORM_LABEL}>{te("Entrada", "Entry")}</Label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setCreateForm((prev) => ({ ...prev, meetupFree: true, meetupPrice: "" }))}
                    className={cn(FORM_CHIP_BASE, createForm.meetupFree ? FORM_CHIP_PRIMARY_ON : FORM_CHIP_IDLE)}
                  >
                    {te("Gratis", "Free")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreateForm((prev) => ({ ...prev, meetupFree: false }))}
                    className={cn(FORM_CHIP_BASE, !createForm.meetupFree ? FORM_CHIP_SECONDARY_ON : FORM_CHIP_IDLE)}
                  >
                    {te("De pago", "Paid")}
                  </button>
                </div>
                {!createForm.meetupFree && (
                  <div className="space-y-1.5 pt-1">
                    <Label htmlFor="wizard-meetup-price" className={FORM_LABEL}>
                      {te("Precio por persona", "Price per person")} <span className="text-primary">*</span>
                    </Label>
                    <Input
                      id="wizard-meetup-price"
                      type="number"
                      inputMode="decimal"
                      min={0.01}
                      step={0.01}
                      className={FORM_CONTROL_INPUT}
                      value={createForm.meetupPrice}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, meetupPrice: e.target.value }))}
                      placeholder={te("Ej: 10", "E.g. 10")}
                    />
                  </div>
                )}
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

      <div className="mb-6" data-explore-stats>
        <div className="rounded-2xl border border-border/50 bg-muted/25 px-2 py-2.5 shadow-sm ring-1 ring-black/[0.04] backdrop-blur-sm dark:bg-card/70 dark:ring-white/[0.06] sm:hidden">
          <p className="mb-2 px-1 text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {te("En esta vista", "On this screen")}
          </p>
          <div className="flex gap-1.5">
            <div className="flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl bg-background/80 px-1.5 py-2 text-center shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] ring-1 ring-border/40 dark:bg-background/40">
              <span className="text-[8px] font-semibold uppercase tracking-wide text-primary/90">
                {te("Total", "Total")}
              </span>
              <span className="text-xl font-bold tabular-nums leading-none tracking-tight text-foreground">
                {exploreSummary.visibleTotal}
              </span>
              <div className="mt-0.5 flex w-full flex-col gap-px text-[8px] leading-snug text-muted-foreground">
                <span>
                  <span className="tabular-nums font-semibold text-foreground/85">{exploreSummary.meetups}</span>{" "}
                  {te("meetups", "meetups")}
                </span>
                <span>
                  <span className="tabular-nums font-semibold text-foreground/85">{exploreSummary.fastDates}</span>{" "}
                  Fast Date
                </span>
              </div>
            </div>
            <div className="flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl bg-background/80 px-1.5 py-2 text-center shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] ring-1 ring-border/40 dark:bg-background/40">
              <span className="text-[8px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                {te("Abiertos", "Open")}
              </span>
              <span className="text-xl font-bold tabular-nums leading-none tracking-tight text-foreground">
                {exploreSummary.meetupsOpen}
              </span>
              <span className="mt-0.5 text-[8px] leading-snug text-muted-foreground">
                {te("OPEN", "OPEN")}
              </span>
            </div>
            <div className="flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl bg-background/80 px-1.5 py-2 text-center shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] ring-1 ring-border/40 dark:bg-background/40">
              <span className="text-[8px] font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
                {te("Plazas", "Spots")}
              </span>
              <span className="text-xl font-bold tabular-nums leading-none tracking-tight text-foreground">
                {exploreSummary.meetupsWithSpots}
              </span>
              <span className="mt-0.5 line-clamp-2 text-[8px] leading-snug text-muted-foreground">
                {exploreSummary.meetups === 0
                  ? te("—", "—")
                  : te("Con cupo", "Has spots")}
              </span>
            </div>
          </div>
        </div>

        <div className="hidden w-full sm:grid sm:grid-cols-3 sm:grid-rows-1 sm:gap-3 [&>*]:min-w-0">
        <Card className="relative col-span-1 min-w-0 gap-0 overflow-hidden border-border/70 bg-gradient-to-br from-card via-card to-primary/[0.08] py-0 shadow-sm ring-1 ring-primary/10">
          <CardContent className="flex gap-2 p-2.5 sm:gap-3 sm:p-5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary shadow-inner sm:size-11 sm:rounded-2xl">
              <Layers className="size-4 sm:size-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground sm:text-[11px]">
                {te("En esta vista", "On this screen")}
              </p>
              <p className="mt-0.5 text-2xl font-bold tabular-nums tracking-tight text-foreground sm:mt-1 sm:text-3xl">
                {exploreSummary.visibleTotal}
              </p>
              <p className="mt-1 text-[10px] leading-snug text-muted-foreground sm:mt-1.5 sm:text-xs">
                <span className="tabular-nums font-medium text-foreground/90">{exploreSummary.meetups}</span>{" "}
                {te("meetups", "meetups")}
                <span className="mx-1.5 text-border">·</span>
                <span className="tabular-nums font-medium text-foreground/90">{exploreSummary.fastDates}</span>{" "}
                Fast Date
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="relative col-span-1 min-w-0 gap-0 overflow-hidden border-border/70 bg-gradient-to-br from-card via-card to-emerald-500/[0.06] py-0 shadow-sm ring-1 ring-emerald-500/15">
          <CardContent className="flex gap-2 p-2.5 sm:gap-3 sm:p-5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 sm:size-11 sm:rounded-2xl">
              <DoorOpen className="size-4 sm:size-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground sm:text-[11px]">
                {te("Meetups abiertos", "Open meetups")}
              </p>
              <p className="mt-0.5 text-2xl font-bold tabular-nums tracking-tight text-foreground sm:mt-1 sm:text-3xl">
                {exploreSummary.meetupsOpen}
              </p>
              <p className="mt-1 text-[10px] leading-snug text-muted-foreground sm:mt-1.5 sm:text-xs">
                {exploreSummary.meetups === 0
                  ? te("Sin meetups en esta vista.", "No meetups in this view.")
                  : te("Estado OPEN en el listado filtrado.", "OPEN status in your filtered list.")}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="relative col-span-1 min-w-0 gap-0 overflow-hidden border-border/70 bg-gradient-to-br from-card via-card to-amber-500/[0.07] py-0 shadow-sm ring-1 ring-amber-500/15">
          <CardContent className="flex gap-2 p-2.5 sm:gap-3 sm:p-5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-400 sm:size-11 sm:rounded-2xl">
              <Users className="size-4 sm:size-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground sm:text-[11px]">
                {te("Con plaza disponible", "Spots available")}
              </p>
              <p className="mt-0.5 text-2xl font-bold tabular-nums tracking-tight text-foreground sm:mt-1 sm:text-3xl">
                {exploreSummary.meetupsWithSpots}
              </p>
              <p className="mt-1 text-[10px] leading-snug text-muted-foreground sm:mt-1.5 sm:text-xs">
                {exploreSummary.meetups === 0
                  ? te("Sin meetups en esta vista.", "No meetups in this view.")
                  : te(
                      "Meetups con cupos libres o sin límite.",
                      "Meetups that still have capacity (or unlimited)."
                    )}
              </p>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-xs font-medium text-muted-foreground">{te("Mostrar", "Show")}</span>
        <div className="flex w-full gap-1 rounded-xl border border-border/70 bg-muted/45 p-1 sm:w-auto sm:min-w-[280px]">
          <button
            type="button"
            onClick={() => applyContentFilter("all")}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all sm:flex-initial",
              contentFilter === "all"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Layers className="size-3.5 shrink-0 opacity-80" aria-hidden />
            {te("Todo", "All")}
          </button>
          <button
            type="button"
            onClick={() => applyContentFilter("meetup")}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all sm:flex-initial",
              contentFilter === "meetup"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <CalendarDays className="size-3.5 shrink-0 opacity-80" aria-hidden />
            {te("Meetups", "Meetups")}
          </button>
          <button
            type="button"
            onClick={() => applyContentFilter("fastdate")}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all sm:flex-initial",
              contentFilter === "fastdate"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Zap className="size-3.5 shrink-0 opacity-80 text-secondary" aria-hidden />
            Fast Date
          </button>
        </div>
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

      <div className="mb-4 flex flex-row items-stretch gap-2 sm:gap-3">
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

        <div className="flex shrink-0 items-stretch">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className={cn(
                  FORM_SELECT_TRIGGER,
                  "h-10 w-auto min-w-[7rem] max-w-[11rem] shrink-0 justify-between gap-2 px-2.5 font-normal shadow-xs sm:max-w-none sm:min-w-[220px] sm:px-3"
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
              {(query || category !== "ALL" || freeOnly !== "ALL" || contentFilter !== "all") && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-muted-foreground focus:text-foreground"
                    onClick={() => {
                      setQuery("")
                      setCategory("ALL")
                      setFreeOnly("ALL")
                      applyContentFilter("all")
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

      <div
        className={cn(
          "mb-4 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground",
          contentFilter === "fastdate" && "hidden"
        )}
      >
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
      ) : (
        <>
          {loadError && contentFilter !== "fastdate" && (
            <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-center space-y-3 sm:flex sm:items-center sm:justify-between sm:text-left sm:space-y-0">
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  {te("Error al cargar meetups", "Error loading meetups")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {te(
                    "El feed de actividad solo incluye eventos grupales (meetups). Puedes seguir viendo Fast Date si cambias el filtro.",
                    "The activity feed only includes group meetups. You can still browse Fast Date by changing the filter."
                  )}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap justify-center gap-2 pt-2 sm:justify-end sm:pt-0">
                <Button variant="outline" size="sm" onClick={() => void loadEvents()}>
                  {te("Reintentar", "Retry")}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => applyContentFilter("fastdate")}
                >
                  Fast Date
                </Button>
              </div>
            </div>
          )}
          {displayedFeed.length === 0 ? (
            <div className="rounded-xl border border-border p-6 sm:p-10 text-center text-muted-foreground space-y-4">
              <p>
              {contentFilter === "meetup"
                ? te(
                    "No hay meetups que coincidan con tu búsqueda o filtros.",
                    "No meetups match your search or filters."
                  )
                : contentFilter === "fastdate"
                  ? te(
                      "No hay Fast Date que coincida con tu búsqueda.",
                      "No fast dates match your search."
                    )
                  : te(
                      "No hay meetups ni citas rápidas que coincidan con tu búsqueda.",
                      "No meetups or fast dates match your search."
                    )}
              </p>
              <ActivityCoreStreamStrip
                te={te}
                context="events"
                mode={
                  (contentFilter === "meetup"
                    ? "MEETUP"
                    : contentFilter === "fastdate"
                      ? "FAST_DATE"
                      : "BOTH") as ActivityCoreExperienceMode
                }
                lat={pulseCoords?.lat}
                lng={pulseCoords?.lng}
                className="text-left"
              />
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {displayedFeed.map((item, index) => {
            if (item.kind === "fastdate") {
              return (
                <FastDateOfferCard
                  key={`fd-${item.card.id}`}
                  card={item.card}
                  currentUserId={user?.userId}
                  onInterest={() => setInterestCard(item.card)}
                  fastDateLabel={te("Fast Date", "Fast Date")}
                  interestLabel={te("Me interesa", "I'm interested")}
                  joinCtaLabel={te("Unirme ahora", "Join now")}
                  expiresLabel={te("Expira", "Expires")}
                  emptyZoneLabel={te("Sin zona indicada", "No zone listed")}
                  hereLabel={te("Aquí", "Here")}
                  activeLabel={te("Activo", "Active")}
                  viewProfileLabel={te("Ver perfil", "View profile")}
                  compatibleLabel={te("compatible", "compatible")}
                  chatVibeLabel={te("💬 Charlar", "💬 Let's chat")}
                  interestedWord={te("interesados", "interested")}
                  potentialMatchesTemplate={(n) =>
                    te(
                      `❤️ ${n} matches potenciales cerca`,
                      `❤️ ${n} potential matches nearby`
                    )
                  }
                  yearsLabel={te("años", "years")}
                  viewerInterests={user?.interests}
                  te={te}
                  localeCode={language === "en" ? "en" : "es"}
                />
              )
            }

            const event = item.event
            const eventKey =
              event._id ||
              `${event._title}-${String((event as { startsAt?: string }).startsAt || "")}-${index}`
            return (
              <MeetupOfferCard
                key={eventKey}
                event={event}
                te={te}
                localeCode={language === "en" ? "en" : "es"}
                currentUserId={user?.userId}
                joiningEventId={joiningEventId}
                onJoin={handleJoinEvent}
              />
            )
              })}
            </div>
          )}
        </>
      )}

      {showFastDateManageSection && (
        <section
          id="fast-date-section"
          className="relative mt-12 scroll-mt-8"
          aria-label={te("Fast Date", "Fast Date")}
        >
          <div className="mb-8 flex items-center justify-center gap-3 px-4" aria-hidden>
            <div className="h-px max-w-[42%] flex-1 bg-gradient-to-r from-transparent to-border/80 dark:to-border/60" />
            <span className="size-2 shrink-0 rounded-full bg-gradient-to-br from-primary to-secondary shadow-sm ring-4 ring-primary/15 dark:ring-primary/25" />
            <div className="h-px max-w-[42%] flex-1 bg-gradient-to-l from-transparent to-border/80 dark:to-border/60" />
          </div>
          <div className="overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-b from-muted/40 via-background to-background p-4 shadow-sm ring-1 ring-black/[0.03] dark:from-muted/15 dark:via-background dark:to-background dark:ring-white/[0.06] sm:p-6">
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
        </section>
      )}

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

