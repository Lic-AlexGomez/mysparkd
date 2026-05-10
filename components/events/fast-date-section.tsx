"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { fastDateService } from "@/lib/services/fastdate"
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
import { FastDateOfferCard } from "@/components/events/fast-date-offer-card"
import { Loader2, Plus, MapPin, Calendar, CalendarClock, Heart, Check, X, Zap, ChevronRight, Send, SlidersHorizontal, ChevronDown, ChevronUp, History } from "lucide-react"
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

  const handleRespond = async (interestId: string, accept: boolean) => {
    try {
      const res = await fastDateService.respondInterest(interestId, accept)
      if (accept) { toast.success("¡Match creado! 🎉"); await fetchMine(); router.push(res?.chatId ? `/chat/${res.chatId}` : '/chat') }
      else { toast.success("Interés rechazado"); await fetchMine() }
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
        <div className="mb-4">
          <h2 className="text-base font-semibold text-foreground">Fast Date</h2>
          <p className="text-xs text-muted-foreground">
            Citas que publicaste, intereses recibidos y solicitudes enviadas.
          </p>
        </div>
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <div className="mb-4 flex items-center gap-2">
          <TabsList className={`grid flex-1 ${hidePublicFeed ? "grid-cols-2" : "grid-cols-3"}`}>
            {!hidePublicFeed && <TabsTrigger value="feed">Feed</TabsTrigger>}
            <TabsTrigger value="mine">Mis citas</TabsTrigger>
            <TabsTrigger value="sent">Enviados</TabsTrigger>
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
                  expiresLabel="Expira"
                />
              ))
            )}
          </TabsContent>
        )}

        <TabsContent value="mine" className="space-y-4">
          {myCards.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Calendar className="h-12 w-12 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No has creado citas aún</p>
              <Button size="sm" variant="outline" onClick={openCreate}>Crear mi primera cita</Button>
            </div>
          ) : (
            <>
              {myCards.filter(c => c.status === 'ACTIVE').map(card => (
                <FDCardItem key={card.dateCardId} card={card} onRespond={handleRespond} router={router}
                  onDelete={async (id) => { try { await fastDateService.delete(id); await fetchMine() } catch (e) { if (!handleDateCardLimitError(e)) toast.error("No se pudo eliminar") } }}
                />
              ))}
              {myCards.filter(c => c.status !== 'ACTIVE').length > 0 && (
                <FDExpiredSection cards={myCards.filter(c => c.status !== 'ACTIVE')} onRespond={handleRespond} router={router} />
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="sent" className="space-y-3">
          {sentInterests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Send className="h-12 w-12 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No has enviado intereses aún</p>
            </div>
          ) : sentInterests.map(interest => (
            <Card key={interest.interestId} className="border-border">
              <CardContent className="p-4 flex items-center gap-3">
                <Avatar className="h-10 w-10 border border-border cursor-pointer shrink-0" onClick={() => interest.profileId && router.push(`/profile/${interest.profileId}`)}>
                  <AvatarImage src={interest.profilePicture} />
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">?</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold line-clamp-1">{interest.title}</p>
                  {interest.message && <p className="text-xs text-muted-foreground line-clamp-1">"{interest.message}"</p>}
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={`text-[10px] px-2 py-0 border-0 ${interest.status === 'ACCEPTED' ? 'bg-green-500/10 text-green-500' : interest.status === 'REJECTED' ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'}`}>
                      {interest.status === 'ACCEPTED' ? '✓ Aceptado' : interest.status === 'REJECTED' ? '✗ Rechazado' : '⏳ Pendiente'}
                    </Badge>
                    {interest.dateStatus === 'DATE_EXPIRED' && <Badge className="text-[10px] px-2 py-0 border-0 bg-muted text-muted-foreground">Expirada</Badge>}
                  </div>
                </div>
                {interest.status === 'ACCEPTED' && (
                  <button onClick={() => router.push('/chat')} className="shrink-0 h-8 w-8 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors">
                    <ChevronRight className="h-4 w-4 text-primary" />
                  </button>
                )}
              </CardContent>
            </Card>
          ))}
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

function FDCardItem({ card, onRespond, router, onDelete }: { card: MyDateCard; onRespond: (id: string, accept: boolean) => void; router: ReturnType<typeof useRouter>; onDelete?: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false)
  const pending = card.interests?.filter((i: any) => i.status === 'PENDING') || []
  return (
    <Card className="border-border">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold">{card.title}</h3>
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
          <div key={interest.interestId} className="mt-2 p-3 rounded-xl bg-muted/50 border border-border flex items-center gap-3">
            <Avatar className="h-9 w-9 shrink-0 cursor-pointer" onClick={() => interest.profileId && router.push(`/profile/${interest.profileId}`)}>
              <AvatarImage src={interest.profilePicture} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs">?</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              {interest.message && <p className="text-xs text-muted-foreground line-clamp-2">"{interest.message}"</p>}
            </div>
            <div className="flex gap-1.5 shrink-0">
              <button onClick={() => onRespond(interest.interestId, true)} className="h-8 w-8 rounded-full bg-green-500/10 hover:bg-green-500/20 flex items-center justify-center text-green-500 transition-colors"><Check className="h-4 w-4" /></button>
              <button onClick={() => onRespond(interest.interestId, false)} className="h-8 w-8 rounded-full bg-destructive/10 hover:bg-destructive/20 flex items-center justify-center text-destructive transition-colors"><X className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function FDExpiredSection({ cards, onRespond, router }: { cards: MyDateCard[]; onRespond: (id: string, accept: boolean) => void; router: ReturnType<typeof useRouter> }) {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2">
        <History className="h-3.5 w-3.5" />{open ? 'Ocultar' : 'Ver'} historial ({cards.length})
        {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>
      {open && <div className="space-y-2 opacity-60">{cards.map(card => <FDCardItem key={card.dateCardId} card={card} onRespond={onRespond} router={router} />)}</div>}
    </div>
  )
}
