"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { fastDateService } from "@/lib/services/fastdate"
import { recordFastDateMatch } from "@/lib/services/moments"
import type { FeedFilter } from "@/lib/services/fastdate"
import { handleDateCardLimitError } from "@/lib/errors/date-card-limits"
import type { DateCard, MyDateCard, SentInterest, DateCategory, Plan, PlaceType } from "@/lib/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
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
} from "@/lib/form-field-classes"
import { toast } from "sonner"
import { useI18n } from "@/lib/i18n"
import { FastDateOfferCard } from "@/components/events/fast-date-offer-card"
import {
  Loader2,
  Plus,
  MapPin,
  Calendar,
  CalendarClock,
  Heart,
  Check,
  X,
  Zap,
  ChevronRight,
  Send,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  History,
  Clock,
  Sparkles,
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

const CATEGORY_LABELS: Record<string, string> = {
  FOOD: "🍽️ Comida", ACTIVITY: "🎯 Actividad", EVENT: "🎉 Evento",
  CHILL: "😌 Chill", ADVENTURE: "🏔️ Aventura", OPEN_SUGGESTION: "💡 Abierto",
}
const PLAN_LABELS: Record<string, string> = {
  CAFE: "☕ Café", RESTAURANT: "🍴 Restaurante", BAR: "🍸 Bar",
  PARK: "🌳 Parque", BEACH: "🏖️ Playa", MALL: "🛍️ Mall",
  CINEMA: "🎬 Cine", OTHER: "📍 Otro", OPEN_SUGGESTION: "💡 Sugerencia",
}
const CATEGORIES: DateCategory[] = ['FOOD', 'ACTIVITY', 'EVENT', 'CHILL', 'ADVENTURE', 'OPEN_SUGGESTION']
const PLANS: Plan[] = ['CAFE', 'RESTAURANT', 'BAR', 'PARK', 'BEACH', 'MALL', 'CINEMA', 'OTHER', 'OPEN_SUGGESTION']

const WHEN_ICON =
  "pointer-events-none absolute left-3 top-1/2 z-[1] size-4 -translate-y-1/2 text-white drop-shadow-[0_1px_3px_rgb(0_0_0/0.85)]"

const FD_TAB_TRIGGER =
  "rounded-xl px-2 py-2.5 text-xs font-semibold shadow-none transition-all data-[state=active]:border data-[state=active]:border-primary/35 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm sm:px-3 sm:text-sm dark:data-[state=active]:bg-card"

type FastDateSectionProps = {
  /** Oculta el botón "Crear cita" cuando el padre abre el asistente unificado */
  suppressInlineCreate?: boolean
  /** Desde el padre: abrir el mismo flujo de creación (meetup / fast date) */
  onRequestCreate?: () => void
  /** Incrementar para forzar recarga del feed y "mis citas" */
  reloadToken?: number
  /** El feed público se muestra en el padre (p. ej. junto a meetups); aquí solo gestión */
  hidePublicFeed?: boolean
}

export function FastDateSection(props?: FastDateSectionProps) {
  const { suppressInlineCreate, onRequestCreate, reloadToken = 0, hidePublicFeed = false } = props ?? {}
  const { user } = useAuth()
  const router = useRouter()
  const { te, language } = useI18n()
  const [tab, setTab] = useState(() => (hidePublicFeed ? "mine" : "feed"))
  const [feed, setFeed] = useState<DateCard[]>([])
  const [myCards, setMyCards] = useState<MyDateCard[]>([])
  const [sentInterests, setSentInterests] = useState<SentInterest[]>([])
  const [feedLoading, setFeedLoading] = useState(!hidePublicFeed)
  const [mineLoading, setMineLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showInterestDialog, setShowInterestDialog] = useState<DateCard | null>(null)
  const [interestMessage, setInterestMessage] = useState("")
  const [sendingInterest, setSendingInterest] = useState(false)
  const [creating, setCreating] = useState(false)
  const [filter, setFilter] = useState<FeedFilter>({})
  const [showFilter, setShowFilter] = useState(false)
  const [form, setForm] = useState({
    title: "", message: "", dateTime: "", locationZone: "",
    category: "FOOD" as DateCategory, detail: "",
    plans: [] as Plan[], placeTypes: [] as PlaceType[],
  })

  const fetchFeed = useCallback(async (f?: FeedFilter) => {
    try {
      const data = await fastDateService.getFeed(f ?? filter)
      setFeed(data)
    } catch (error) {
      handleDateCardLimitError(error)
      setFeed([])
    }
  }, [filter])

  const fetchMine = useCallback(async () => {
    try {
      const [cards, sent] = await Promise.all([fastDateService.getMine(), fastDateService.getSentInterests()])
      setMyCards(cards)
      setSentInterests(sent)
    } catch (error) {
      handleDateCardLimitError(error)
    }
  }, [])

  useEffect(() => {
    if (hidePublicFeed && tab === "feed") setTab("mine")
  }, [hidePublicFeed, tab])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        await fetchMine()
      } finally {
        if (!cancelled) setMineLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [fetchMine, reloadToken])

  useEffect(() => {
    if (hidePublicFeed) {
      setFeedLoading(false)
      return
    }
    let cancelled = false
    setFeedLoading(true)
    ;(async () => {
      try {
        await fetchFeed()
      } finally {
        if (!cancelled) setFeedLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [fetchFeed, reloadToken, hidePublicFeed])

  const openCreate = () => {
    if (onRequestCreate) onRequestCreate()
    else setShowCreateDialog(true)
  }

  const applyFilter = (f: FeedFilter) => { setFilter(f); setShowFilter(false); fetchFeed(f) }

  const handleCreate = async () => {
    if (!form.title || !form.dateTime || !form.locationZone || form.plans.length === 0) {
      toast.error("Completa los campos obligatorios"); return
    }
    setCreating(true)
    try {
      await fastDateService.create({ ...form, dateTime: new Date(form.dateTime).toISOString(), placeTypes: form.plans as unknown as PlaceType[] })
      toast.success("¡Cita creada!")
      setShowCreateDialog(false)
      setForm({ title: "", message: "", dateTime: "", locationZone: "", category: "FOOD", detail: "", plans: [], placeTypes: [] })
      fetchFeed(); fetchMine()
    } catch (error) {
      if (!handleDateCardLimitError(error)) toast.error(error instanceof Error ? error.message : "Error al crear cita")
    } finally { setCreating(false) }
  }

  const handleSendInterest = async () => {
    if (!showInterestDialog) return
    setSendingInterest(true)
    try {
      await fastDateService.sendInterest(showInterestDialog.id, interestMessage)
      toast.success("¡Interés enviado!")
      setShowInterestDialog(null); setInterestMessage(""); await fetchMine(); setTab("sent")
    } catch (error) {
      if (!handleDateCardLimitError(error)) toast.error(error instanceof Error ? error.message : "Error")
    } finally { setSendingInterest(false) }
  }

  const handleRespond = async (
    interestId: string,
    accept: boolean,
    ctx?: { peerUserId?: string; peerUsername?: string; dateCardId?: string }
  ) => {
    try {
      const res = await fastDateService.respondInterest(interestId, accept)
      if (accept) {
        if (user?.userId && ctx?.peerUserId) {
          recordFastDateMatch({
            ownerUserId: user.userId,
            ownerUsername: user.username,
            peerUserId: ctx.peerUserId,
            peerUsername: ctx.peerUsername,
            interestId,
            dateCardId: ctx.dateCardId,
          })
        }
        toast.success("¡Match creado! 🎉")
        await fetchMine()
        if (res?.chatId) {
          const q = new URLSearchParams()
          if (ctx?.dateCardId) q.set("fdId", ctx.dateCardId)
          q.set("title", "Fast Date")
          router.push(`/chat/${res.chatId}?${q.toString()}`)
        } else {
          router.push("/chat")
        }
      } else {
        toast.success("Interés rechazado")
        await fetchMine()
      }
    } catch (error) {
      if (!handleDateCardLimitError(error)) toast.error(error instanceof Error ? error.message : "Error")
    }
  }

  const togglePlan = (plan: Plan) => setForm(prev => ({
    ...prev, plans: prev.plans.includes(plan) ? prev.plans.filter(p => p !== plan) : [...prev.plans, plan]
  }))

  if (!hidePublicFeed && feedLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (hidePublicFeed && mineLoading) {
    return (
      <div className="flex h-24 items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div>
      {!hidePublicFeed && (
        <div className="mb-4 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Propón una cita 1 a 1, conecta al instante</p>
          {!suppressInlineCreate && (
            <Button size="sm" onClick={openCreate} className="bg-gradient-to-r from-primary to-secondary font-bold text-black">
              <Plus className="mr-1 h-4 w-4" />
              Crear cita
            </Button>
          )}
        </div>
      )}

      {hidePublicFeed && (
        <div className="relative mb-5 overflow-hidden rounded-2xl border border-border/55 bg-gradient-to-br from-primary/[0.09] via-card to-secondary/[0.06] p-4 shadow-sm ring-1 ring-black/[0.04] dark:from-primary/[0.12] dark:ring-white/[0.07]">
          <div className="pointer-events-none absolute -right-10 -top-14 size-36 rounded-full bg-primary/25 blur-3xl dark:bg-primary/20" aria-hidden />
          <div className="pointer-events-none absolute -bottom-12 -left-8 size-28 rounded-full bg-secondary/20 blur-2xl dark:bg-secondary/15" aria-hidden />
          <div className="relative flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/25 to-secondary/20 shadow-inner ring-1 ring-white/10 dark:ring-white/15">
              <Sparkles className="size-5 text-primary" aria-hidden />
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <h2 className="text-lg font-bold tracking-tight text-foreground">{te("Fast Date", "Fast Date")}</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {te(
                  "Citas que publicaste, intereses recibidos y solicitudes enviadas.",
                  "Dates you posted, interests you received, and requests you sent."
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <div className="mb-4 flex items-center gap-2">
          <TabsList
            className={cn(
              "grid h-auto min-h-11 flex-1 gap-1 rounded-2xl border border-border/60 bg-muted/35 p-1.5 shadow-inner ring-1 ring-black/[0.03] dark:bg-muted/25 dark:ring-white/[0.06]",
              hidePublicFeed ? "grid-cols-2" : "grid-cols-3"
            )}
          >
            {!hidePublicFeed && (
              <TabsTrigger value="feed" className={FD_TAB_TRIGGER}>
                Feed
              </TabsTrigger>
            )}
            <TabsTrigger value="mine" className={FD_TAB_TRIGGER}>
              {te("Mis citas", "My dates")}
            </TabsTrigger>
            <TabsTrigger value="sent" className={FD_TAB_TRIGGER}>
              {te("Enviados", "Sent")}
            </TabsTrigger>
          </TabsList>
          {!hidePublicFeed && (
            <button
              type="button"
              onClick={() => setShowFilter(!showFilter)}
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-colors ${Object.keys(filter).length > 0 ? "border-primary bg-primary text-black" : "border-border text-muted-foreground hover:border-primary/50"}`}
            >
              <SlidersHorizontal className="h-4 w-4" />
            </button>
          )}
        </div>

        {!hidePublicFeed && showFilter && (
          <div className="mb-4 space-y-3 rounded-2xl border border-border bg-card p-4">
            <p className="text-sm font-semibold text-foreground">Filtrar feed</p>
            <div className="grid grid-cols-2 gap-3">
              {[["Distancia máx (km)", "maxDistanceKm", "10"], ["Compatibilidad mín (%)", "minCompatibility", "50"], ["Edad mín", "minAge", "18"], ["Edad máx", "maxAge", "99"]].map(([label, key, ph]) => (
                <div key={key} className="space-y-1.5">
                  <Label className={cn(FORM_LABEL, "text-xs")}>{label}</Label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    placeholder={ph}
                    value={(filter as Record<string, number | undefined>)[key as string] != null ? String((filter as Record<string, number | undefined>)[key as string]) : ""}
                    onChange={(e) =>
                      setFilter((p) => ({
                        ...p,
                        [key]: e.target.value ? Number(e.target.value) : undefined,
                      }))
                    }
                    className={FORM_CONTROL_INPUT}
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => applyFilter({})}>Limpiar</Button>
              <Button size="sm" className="flex-1 bg-gradient-to-r from-primary to-secondary text-black font-bold" onClick={() => applyFilter(filter)}>Aplicar</Button>
            </div>
          </div>
        )}

        {!hidePublicFeed && (
          <TabsContent value="feed" className="space-y-3">
            {feed.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16">
                <Zap className="h-12 w-12 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No hay citas disponibles</p>
                <Button size="sm" variant="outline" onClick={openCreate}>
                  Sé el primero
                </Button>
              </div>
            ) : (
              feed.map((card) => (
                <FastDateOfferCard
                  key={card.id}
                  card={card}
                  currentUserId={user?.userId}
                  onInterest={() => setShowInterestDialog(card)}
                  fastDateLabel="Fast Date"
                  interestLabel="Me interesa"
                  joinCtaLabel="Unirme ahora"
                  expiresLabel={te("Expira", "Expires")}
                  emptyZoneLabel={te("Sin zona indicada", "No zone listed")}
                  hereLabel={te("Aquí", "Here")}
                  activeLabel="Activo"
                  viewProfileLabel="Ver perfil"
                  compatibleLabel="compatible"
                  chatVibeLabel="💬 Charlar"
                  interestedWord="interesados"
                  potentialMatchesTemplate={(n) =>
                    te(
                      `❤️ ${n} matches potenciales cerca`,
                      `❤️ ${n} potential matches nearby`
                    )
                  }
                  yearsLabel="años"
                  viewerInterests={user?.interests}
                  te={te}
                  localeCode={language === "en" ? "en" : "es"}
                />
              ))
            )}
          </TabsContent>
        )}

        <TabsContent value="mine" className="space-y-4">
          {myCards.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border/70 bg-muted/20 px-6 py-16">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-muted/50 ring-1 ring-border/60">
                <Calendar className="size-7 text-muted-foreground" aria-hidden />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">{te("Aún no publicas citas", "You have not posted any dates yet")}</p>
                <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                  {te("Crea una y recibirás solicitudes aquí.", "Create one and incoming requests will show up here.")}
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={openCreate}>
                {te("Crear mi primera cita", "Create my first date")}
              </Button>
            </div>
          ) : (
            <>
              {myCards.filter(c => c.status === 'ACTIVE').map(card => (
                <FDCardItem key={card.dateCardId} card={card} onRespond={handleRespond} router={router}
                  onDelete={async (id) => { try { await fastDateService.delete(id); await fetchMine() } catch (e) { if (!handleDateCardLimitError(e)) toast.error("No se pudo eliminar") } }}
                />
              ))}
              {myCards.filter(c => c.status !== 'ACTIVE').length > 0 && (
                <FDExpiredSection
                  cards={myCards.filter((c) => c.status !== "ACTIVE")}
                  onRespond={handleRespond}
                  router={router}
                  te={te}
                />
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="sent">
          {sentInterests.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border/70 bg-muted/20 px-6 py-16">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-muted/50 ring-1 ring-border/60">
                <Send className="size-7 text-muted-foreground" aria-hidden />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">
                  {te("Aún no envías solicitudes", "You have not sent any requests yet")}
                </p>
                <p className="mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">
                  {te(
                    "Explora el feed y pulsa «Me interesa» en una cita que te encaje.",
                    "Browse the feed and tap “I’m interested” on a date that fits you."
                  )}
                </p>
              </div>
            </div>
          ) : (
            <div className="mx-auto grid w-full max-w-xl grid-cols-1 gap-2 sm:max-w-3xl sm:grid-cols-2">
              {sentInterests.map((interest) => (
                <FastDateSentInterestCard key={interest.interestId} interest={interest} router={router} te={te} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Zap className="h-5 w-5 text-primary" />Crear cita</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-0.5">
            <div className="space-y-1.5">
              <Label htmlFor="fd-inline-title" className={FORM_LABEL}>Título <span className="text-primary">*</span></Label>
              <Input id="fd-inline-title" className={FORM_CONTROL_INPUT} value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Ej: Café tranquilo esta tarde" maxLength={100} autoComplete="off" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fd-inline-msg" className={FORM_LABEL}>Mensaje <span className={FORM_LABEL_OPTIONAL_HINT}>(opcional)</span></Label>
              <Textarea id="fd-inline-msg" value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} placeholder="Cuéntales más..." className={FORM_CONTROL_TEXTAREA} maxLength={700} />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="fd-inline-when" className={FORM_LABEL}>Fecha y hora <span className="text-primary">*</span></Label>
                <div className="relative">
                  <CalendarClock className={WHEN_ICON} aria-hidden />
                  <Input id="fd-inline-when" type="datetime-local" className={cn(FORM_CONTROL_INPUT, "pl-10")} value={form.dateTime} onChange={e => setForm(p => ({ ...p, dateTime: e.target.value }))} min={new Date().toISOString().slice(0, 16)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fd-inline-zone" className={FORM_LABEL}>Zona <span className="text-primary">*</span></Label>
                <Input id="fd-inline-zone" className={FORM_CONTROL_INPUT} value={form.locationZone} onChange={e => setForm(p => ({ ...p, locationZone: e.target.value }))} placeholder="Ej: Centro" autoComplete="off" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className={FORM_LABEL}>Categoría <span className="text-primary">*</span></Label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(cat => (
                  <button key={cat} type="button" onClick={() => setForm(p => ({ ...p, category: cat }))} className={cn(FORM_CHIP_BASE, form.category === cat ? FORM_CHIP_PRIMARY_ON : FORM_CHIP_IDLE)}>{CATEGORY_LABELS[cat]}</button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label className={FORM_LABEL}>Planes <span className="text-primary">*</span> <span className={FORM_LABEL_OPTIONAL_HINT}>(al menos uno)</span></Label>
              <div className="flex flex-wrap gap-2">
                {PLANS.map(plan => (
                  <button key={plan} type="button" onClick={() => togglePlan(plan)} className={cn(FORM_CHIP_BASE, form.plans.includes(plan) ? FORM_CHIP_SECONDARY_ON : FORM_CHIP_IDLE)}>{PLAN_LABELS[plan]}</button>
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="flex-1">Cancelar</Button>
              <Button onClick={handleCreate} disabled={creating} className="flex-1 bg-gradient-to-r from-primary to-secondary text-black font-bold">
                {creating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Crear cita
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!showInterestDialog} onOpenChange={() => setShowInterestDialog(null)}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader><DialogTitle>Enviar interés</DialogTitle></DialogHeader>
          {showInterestDialog && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-muted/50 border border-border">
                <p className="text-sm font-semibold">{showInterestDialog.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{format(new Date(showInterestDialog.dateTime), "d MMM, HH:mm", { locale: es })} · {showInterestDialog.locationZone}</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fd-interest-msg" className={FORM_LABEL}>Tu mensaje</Label>
                <Textarea id="fd-interest-msg" value={interestMessage} onChange={e => setInterestMessage(e.target.value)} placeholder="Preséntate..." className={FORM_CONTROL_TEXTAREA} maxLength={300} />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowInterestDialog(null)} className="flex-1">Cancelar</Button>
                <Button onClick={handleSendInterest} disabled={sendingInterest} className="flex-1 bg-gradient-to-r from-primary to-secondary text-black font-bold">
                  {sendingInterest ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Heart className="h-4 w-4 mr-1" />}Enviar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function sentInterestStatusPill(
  interest: SentInterest,
  te: (es: string, en: string) => string
) {
  const expired = interest.dateStatus === "DATE_EXPIRED"
  if (interest.status === "ACCEPTED") {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold leading-tight text-emerald-800 dark:text-emerald-400">
        <Check className="size-2.5 shrink-0 stroke-[2.5]" aria-hidden />
        {te("Match", "Match")}
      </span>
    )
  }
  if (interest.status === "REJECTED") {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full bg-destructive/12 px-2 py-0.5 text-[10px] font-semibold leading-tight text-destructive">
        <X className="size-2.5 shrink-0 stroke-[2.5]" aria-hidden />
        {te("Rechazado", "Declined")}
      </span>
    )
  }
  if (expired) {
    return (
      <span className="inline-flex max-w-full items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium leading-tight text-amber-950 dark:text-amber-100">
        <Clock className="size-2.5 shrink-0 opacity-90" aria-hidden />
        {te("Sin respuesta · cita expirada", "No reply · date expired")}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-0.5 rounded-full bg-primary/14 px-2 py-0.5 text-[10px] font-semibold leading-tight text-primary">
      {te("Esperando respuesta", "Awaiting reply")}
    </span>
  )
}

function FastDateSentInterestCard({
  interest,
  router,
  te,
}: {
  interest: SentInterest
  router: ReturnType<typeof useRouter>
  te: (es: string, en: string) => string
}) {
  return (
    <Card className="min-w-0 gap-0 py-0 overflow-hidden border-border/55 bg-gradient-to-br from-card via-card to-primary/[0.05] shadow-sm ring-1 ring-white/[0.05] dark:to-primary/[0.07] dark:ring-white/[0.07]">
      <CardContent className="p-0">
        <div className="flex gap-2 p-2.5 sm:gap-2.5 sm:p-3">
          <button
            type="button"
            className="relative shrink-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background"
            onClick={() => interest.profileId && router.push(`/profile/${interest.profileId}`)}
            aria-label={te("Ver perfil del anfitrión", "View host profile")}
          >
            <Avatar className="size-9 border border-border/70 shadow-sm ring-1 ring-background sm:size-10">
              <AvatarImage src={interest.profilePicture} alt="" />
              <AvatarFallback className="bg-primary/12 text-xs font-semibold text-primary">?</AvatarFallback>
            </Avatar>
          </button>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-start justify-between gap-1.5">
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-semibold leading-snug tracking-tight text-foreground">
                  {interest.title}
                </p>
              </div>
              {interest.status === "ACCEPTED" && (
                <button
                  type="button"
                  onClick={() => router.push("/chat")}
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary transition-colors hover:bg-primary/20"
                  aria-label={te("Ir al chat", "Open chat")}
                >
                  <ChevronRight className="size-4" aria-hidden />
                </button>
              )}
            </div>
            {interest.message ? (
              <div className="rounded-lg border border-border/45 bg-muted/30 px-2 py-1.5 dark:bg-muted/20">
                <p className="line-clamp-2 text-xs leading-snug text-foreground/90">
                  <span className="text-muted-foreground/70">{"\u201C"}</span>
                  {interest.message}
                  <span className="text-muted-foreground/70">{"\u201D"}</span>
                </p>
              </div>
            ) : (
              <p className="text-[11px] italic leading-none text-muted-foreground/90">{te("Sin mensaje", "No message")}</p>
            )}
            <div className="flex flex-wrap items-center gap-1 pt-0.5">{sentInterestStatusPill(interest, te)}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function FDCardItem({
  card,
  onRespond,
  router,
  onDelete,
}: {
  card: MyDateCard
  onRespond: (
    id: string,
    accept: boolean,
    ctx?: { peerUserId?: string; peerUsername?: string; dateCardId?: string }
  ) => void
  router: ReturnType<typeof useRouter>
  onDelete?: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const pending = card.interests?.filter((i: any) => i.status === 'PENDING') || []
  return (
    <Card className="gap-0 py-0 overflow-hidden border-border/55 bg-gradient-to-br from-card via-card to-emerald-500/[0.05] shadow-sm ring-1 ring-white/[0.06] dark:to-emerald-500/[0.07] dark:ring-white/[0.08]">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-[15px] font-semibold leading-tight tracking-tight sm:text-base">{card.title}</h3>
              {card.totalInterests != null && card.totalInterests > 0 && <Badge className="text-[10px] px-2 py-0 border-0 bg-primary/10 text-primary">{card.totalInterests} interesado{card.totalInterests > 1 ? 's' : ''}</Badge>}
            </div>
            {card.dateTime && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 flex-wrap">
                <Calendar className="h-3 w-3" />{format(new Date(card.dateTime), 'd MMM, HH:mm', { locale: es })}
                {card.locationZone && <><MapPin className="h-3 w-3 ml-1" />{card.locationZone}</>}
              </p>
            )}
          </div>
          {onDelete && (
            <button onClick={() => onDelete(card.dateCardId)} className="h-7 w-7 rounded-full hover:bg-destructive/10 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors shrink-0">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {pending.length > 0 && (
          <button onClick={() => setExpanded(!expanded)} className="mt-3 w-full flex items-center justify-between text-xs font-semibold text-primary hover:text-primary/80 transition-colors">
            <span>{pending.length} solicitud{pending.length > 1 ? 'es' : ''} pendiente{pending.length > 1 ? 's' : ''}</span>
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        )}
        {expanded && pending.map((interest: any) => (
          <div
            key={interest.interestId}
            className="mt-3 flex items-center gap-3 rounded-xl border border-border/60 bg-muted/35 p-3 ring-1 ring-black/[0.03] dark:bg-muted/25 dark:ring-white/[0.05]"
          >
            <Avatar className="h-10 w-10 shrink-0 cursor-pointer ring-2 ring-background" onClick={() => interest.profileId && router.push(`/profile/${interest.profileId}`)}>
              <AvatarImage src={interest.profilePicture} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs">?</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              {interest.message && (
                <p className="text-xs leading-snug text-muted-foreground line-clamp-3">
                  <span className="text-muted-foreground/70">{"\u201C"}</span>
                  {interest.message}
                  <span className="text-muted-foreground/70">{"\u201D"}</span>
                </p>
              )}
            </div>
            <div className="flex shrink-0 gap-1.5">
              <button
                onClick={() =>
                  onRespond(interest.interestId, true, {
                    peerUserId: String(interest.userId || interest.profileId || "").trim() || undefined,
                    peerUsername: undefined,
                    dateCardId: card.dateCardId,
                  })
                }
                className="flex size-9 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 transition-colors hover:bg-emerald-500/25 dark:text-emerald-400"
                aria-label="Aceptar"
              >
                <Check className="size-4" />
              </button>
              <button
                onClick={() => onRespond(interest.interestId, false)}
                className="flex size-9 items-center justify-center rounded-full bg-destructive/12 text-destructive transition-colors hover:bg-destructive/20"
                aria-label="Rechazar"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function FDExpiredSection({
  cards,
  onRespond,
  router,
  te,
}: {
  cards: MyDateCard[]
  onRespond: (
    id: string,
    accept: boolean,
    ctx?: { peerUserId?: string; peerUsername?: string; dateCardId?: string }
  ) => void
  router: ReturnType<typeof useRouter>
  te: (es: string, en: string) => string
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-border/60 bg-muted/25 px-3 py-2.5 text-left text-xs font-medium text-muted-foreground transition-colors hover:border-border hover:bg-muted/40 hover:text-foreground"
      >
        <span className="flex items-center gap-2">
          <History className="size-3.5 shrink-0" aria-hidden />
          {te(`Historial (${cards.length})`, `History (${cards.length})`)}
        </span>
        {open ? <ChevronUp className="size-3.5 shrink-0 opacity-70" aria-hidden /> : <ChevronDown className="size-3.5 shrink-0 opacity-70" aria-hidden />}
      </button>
      {open && (
        <div className="mt-2 space-y-3 opacity-[0.92]">
          {cards.map((card) => (
            <FDCardItem key={card.dateCardId} card={card} onRespond={onRespond} router={router} />
          ))}
        </div>
      )}
    </div>
  )
}
