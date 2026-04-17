"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { fastDateService } from "@/lib/services/fastdate"
import type { FeedFilter } from "@/lib/services/fastdate"
import type { DateCard, MyDateCard, SentInterest, DateCategory, Plan, PlaceType } from "@/lib/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { Loader2, Plus, MapPin, Calendar, Clock, Heart, Check, X, Zap, ChevronRight, Send, SlidersHorizontal } from "lucide-react"
import { formatDistanceToNow, format } from "date-fns"
import { es } from "date-fns/locale"

const CATEGORY_LABELS: Record<string, string> = {
  FOOD: "🍽️ Comida",
  ACTIVITY: "🎯 Actividad",
  EVENT: "🎉 Evento",
  CHILL: "😌 Chill",
  ADVENTURE: "🏔️ Aventura",
  OPEN_SUGGESTION: "💡 Abierto",
}

const PLAN_LABELS: Record<string, string> = {
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

const CATEGORIES: DateCategory[] = ['FOOD', 'ACTIVITY', 'EVENT', 'CHILL', 'ADVENTURE', 'OPEN_SUGGESTION']
const PLANS: Plan[] = ['CAFE', 'RESTAURANT', 'BAR', 'PARK', 'BEACH', 'MALL', 'CINEMA', 'OTHER', 'OPEN_SUGGESTION']

export default function FastDatePage() {
  const { user } = useAuth()
  const router = useRouter()
  const [tab, setTab] = useState("feed")
  const [feed, setFeed] = useState<DateCard[]>([])
  const [myCards, setMyCards] = useState<MyDateCard[]>([])
  const [sentInterests, setSentInterests] = useState<SentInterest[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showInterestDialog, setShowInterestDialog] = useState<DateCard | null>(null)
  const [interestMessage, setInterestMessage] = useState("")
  const [sendingInterest, setSendingInterest] = useState(false)
  const [creating, setCreating] = useState(false)
  const [filter, setFilter] = useState<FeedFilter>({})
  const [showFilter, setShowFilter] = useState(false)

  const [form, setForm] = useState({
    title: "",
    message: "",
    dateTime: "",
    locationZone: "",
    category: "FOOD" as DateCategory,
    detail: "",
    plans: [] as Plan[],
    placeTypes: [] as PlaceType[],
  })

  const fetchFeed = useCallback(async (f?: FeedFilter) => {
    try {
      const data = await fastDateService.getFeed(f ?? filter)
      setFeed(data)
    } catch {
      setFeed([])
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const applyFilter = (newFilter: FeedFilter) => {
    setFilter(newFilter)
    setShowFilter(false)
    fetchFeed(newFilter)
  }

  const fetchMine = useCallback(async () => {
    try {
      const [cards, sent] = await Promise.all([
        fastDateService.getMine(),
        fastDateService.getSentInterests(),
      ])
      setMyCards(cards)
      setSentInterests(sent)
    } catch {}
  }, [])

  useEffect(() => {
    fetchFeed()
    fetchMine()
  }, [fetchFeed, fetchMine])

  const handleCreate = async () => {
    if (!form.title || !form.dateTime || !form.locationZone || form.plans.length === 0) {
      toast.error("Completa los campos obligatorios")
      return
    }
    setCreating(true)
    try {
      await fastDateService.create({
        ...form,
        dateTime: new Date(form.dateTime).toISOString(),
        placeTypes: form.plans as unknown as PlaceType[],
      })
      toast.success("¡Cita creada!")
      setShowCreateDialog(false)
      setForm({ title: "", message: "", dateTime: "", locationZone: "", category: "FOOD", detail: "", plans: [], placeTypes: [] })
      fetchFeed()
      fetchMine()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al crear cita")
    } finally {
      setCreating(false)
    }
  }

  const handleSendInterest = async () => {
    if (!showInterestDialog) return
    setSendingInterest(true)
    try {
      await fastDateService.sendInterest(showInterestDialog.id, interestMessage)
      toast.success("¡Interés enviado! Revisa la pestaña 'Enviados'")
      setShowInterestDialog(null)
      setInterestMessage("")
      await fetchMine()
      setTab("sent")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al enviar interés")
    } finally {
      setSendingInterest(false)
    }
  }

  const handleRespond = async (interestId: string, accept: boolean) => {
    try {
      const res = await fastDateService.respondInterest(interestId, accept)
      if (accept) {
        toast.success("¡Match creado! 🎉")
        await fetchMine()
        if (res?.chatId) {
          router.push(`/chat/${res.chatId}`)
        } else {
          router.push('/chat')
        }
      } else {
        toast.success("Interés rechazado")
        await fetchMine()
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error")
    }
  }

  const togglePlan = (plan: Plan) => {
    setForm(prev => ({
      ...prev,
      plans: prev.plans.includes(plan)
        ? prev.plans.filter(p => p !== plan)
        : [...prev.plans, plan]
    }))
  }

  const isOwnCard = (card: DateCard) => card.userId === user?.userId

  if (loading) return (
    <div className="flex h-[60vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )

  return (
    <div className="mx-auto max-w-2xl px-4 py-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Fast Date
          </h1>
          <p className="text-xs text-muted-foreground">Propón una cita, conecta al instante</p>
        </div>
        <Button
          size="sm"
          onClick={() => setShowCreateDialog(true)}
          className="bg-gradient-to-r from-primary to-secondary text-black font-bold"
        >
          <Plus className="h-4 w-4 mr-1" />
          Crear cita
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <div className="flex items-center gap-2 mb-4">
          <TabsList className="flex-1 grid grid-cols-3">
            <TabsTrigger value="feed">Feed</TabsTrigger>
            <TabsTrigger value="mine">Mis citas</TabsTrigger>
            <TabsTrigger value="sent">Enviados</TabsTrigger>
          </TabsList>
          <button
            onClick={() => setShowFilter(!showFilter)}
            className={`h-9 w-9 rounded-xl flex items-center justify-center border transition-colors shrink-0 ${
              Object.keys(filter).length > 0
                ? 'bg-primary text-black border-primary'
                : 'border-border text-muted-foreground hover:border-primary/50'
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>

        {/* Panel de filtros */}
        {showFilter && (
          <div className="mb-4 p-4 bg-card border border-border rounded-2xl space-y-3">
            <p className="text-xs font-semibold text-foreground">Filtrar feed</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Distancia máx (km)</label>
                <Input
                  type="number"
                  placeholder="Ej: 10"
                  value={filter.maxDistanceKm ?? ''}
                  onChange={e => setFilter(p => ({ ...p, maxDistanceKm: e.target.value ? Number(e.target.value) : undefined }))}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Compatibilidad mín (%)</label>
                <Input
                  type="number"
                  placeholder="Ej: 50"
                  value={filter.minCompatibility ?? ''}
                  onChange={e => setFilter(p => ({ ...p, minCompatibility: e.target.value ? Number(e.target.value) : undefined }))}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Edad mín</label>
                <Input
                  type="number"
                  placeholder="18"
                  value={filter.minAge ?? ''}
                  onChange={e => setFilter(p => ({ ...p, minAge: e.target.value ? Number(e.target.value) : undefined }))}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Edad máx</label>
                <Input
                  type="number"
                  placeholder="99"
                  value={filter.maxAge ?? ''}
                  onChange={e => setFilter(p => ({ ...p, maxAge: e.target.value ? Number(e.target.value) : undefined }))}
                  className="h-8 text-sm"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => applyFilter({})}
              >
                Limpiar
              </Button>
              <Button
                size="sm"
                className="flex-1 bg-gradient-to-r from-primary to-secondary text-black font-bold"
                onClick={() => applyFilter(filter)}
              >
                Aplicar
              </Button>
            </div>
          </div>
        )}

        {/* FEED */}
        <TabsContent value="feed" className="space-y-3">
          {feed.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Zap className="h-12 w-12 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No hay citas disponibles</p>
              <Button size="sm" variant="outline" onClick={() => setShowCreateDialog(true)}>
                Sé el primero en crear una
              </Button>
            </div>
          ) : feed.map(card => (
            <Card key={card.id} className="border-border hover:border-primary/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar
                    className="h-10 w-10 border-2 border-primary/20 cursor-pointer shrink-0"
                    onClick={() => router.push(`/profile/${card.userId}`)}
                  >
                    <AvatarImage src={card.mainPhotoUrl} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {card.username?.[0]?.toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap ">
                      <span className="text-sm font-semibold text-foreground">@{card.username}</span>
                      <Badge className="text-[10px] px-2 py-0 border-0 bg-primary/10 text-primary">
                        {CATEGORY_LABELS[card.category] || card.category}
                      </Badge>
                    </div>
                    <h3 className="text-sm font-bold text-foreground mt-1">{card.title}</h3>
                    {card.message && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{card.message}</p>
                    )}
                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(card.dateTime), "d MMM, HH:mm", { locale: es })}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {card.locationZone}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Expira {formatDistanceToNow(new Date(card.expiresAt), { addSuffix: true, locale: es })}
                      </span>
                    </div>
                    {card.plans && card.plans.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {card.plans.map(p => (
                          <span key={p} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                            {PLAN_LABELS[p] || p}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                {!isOwnCard(card) && (
                  <Button
                    size="sm"
                    className="w-full mt-3 bg-gradient-to-r from-primary to-secondary text-black font-bold"
                    onClick={() => setShowInterestDialog(card)}
                  >
                    <Heart className="h-4 w-4 mr-1" />
                    Me interesa
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* MIS CITAS */}
        <TabsContent value="mine" className="space-y-3">
          {myCards.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Calendar className="h-12 w-12 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No has creado citas aún</p>
              <Button size="sm" variant="outline" onClick={() => setShowCreateDialog(true)}>
                Crear mi primera cita
              </Button>
            </div>
          ) : myCards.map(card => (
            <Card key={card.dateCardId} className="border-border">
              <CardContent className="p-4">
                {/* Detalles de la cita */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-sm font-bold text-foreground">{card.title}</h3>
                  {card.category && (
                    <Badge className="text-[10px] px-2 py-0 border-0 bg-primary/10 text-primary shrink-0">
                      {CATEGORY_LABELS[card.category] || card.category}
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-2">
                  {card.dateTime && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(card.dateTime), "d MMM, HH:mm", { locale: es })}
                    </span>
                  )}
                  {card.locationZone && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {card.locationZone}
                    </span>
                  )}
                  {card.expiresAt && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Expira {formatDistanceToNow(new Date(card.expiresAt), { addSuffix: true, locale: es })}
                    </span>
                  )}
                </div>
                {card.plans && card.plans.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {card.plans.map(p => (
                      <span key={p} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        {PLAN_LABELS[p] || p}
                      </span>
                    ))}
                  </div>
                )}
                {card.message && (
                  <p className="text-xs text-muted-foreground italic mb-2">"{card.message}"</p>
                )}

                {/* Intereses recibidos */}
                <div className="border-t border-border pt-3 mt-1">
                  {card.interests.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Nadie ha mostrado interés aún</p>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-muted-foreground">
                        {card.interests.length} {card.interests.length === 1 ? "persona interesada" : "personas interesadas"}
                      </p>
                      {card.interests.map((interest, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <Avatar
                            className="h-9 w-9 border border-border cursor-pointer shrink-0"
                            onClick={() => interest.userId && router.push(`/profile/${interest.userId}`)}
                          >
                            <AvatarImage src={interest.profilePicture} />
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">?</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            {interest.message && (
                              <p className="text-xs text-muted-foreground line-clamp-1">"{interest.message}"</p>
                            )}
                            <Badge
                              className={`text-[10px] px-2 py-0 border-0 mt-0.5 ${
                                interest.status === 'ACCEPTED' ? 'bg-green-500/10 text-green-500' :
                                interest.status === 'REJECTED' ? 'bg-destructive/10 text-destructive' :
                                'bg-muted text-muted-foreground'
                              }`}
                            >
                              {interest.status === 'ACCEPTED' ? '✓ Aceptado' :
                               interest.status === 'REJECTED' ? '✗ Rechazado' : 'Pendiente'}
                            </Badge>
                          </div>
                          {interest.status === 'PENDING' && (
                            <div className="flex gap-1 shrink-0">
                              <button
                                onClick={() => handleRespond(interest.interestId, true)}
                                className="h-8 w-8 rounded-full bg-green-500/10 hover:bg-green-500/20 flex items-center justify-center transition-colors"
                              >
                                <Check className="h-4 w-4 text-green-500" />
                              </button>
                              <button
                                onClick={() => handleRespond(interest.interestId, false)}
                                className="h-8 w-8 rounded-full bg-destructive/10 hover:bg-destructive/20 flex items-center justify-center transition-colors"
                              >
                                <X className="h-4 w-4 text-destructive" />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* INTERESES ENVIADOS */}
        <TabsContent value="sent" className="space-y-3">
          {sentInterests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Send className="h-12 w-12 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No has enviado intereses aún</p>
            </div>
          ) : sentInterests.map(interest => (
            <Card key={interest.interestId} className="border-border">
              <CardContent className="p-4 flex items-center gap-3">
                <Avatar
                  className="h-10 w-10 border border-border cursor-pointer shrink-0"
                  onClick={() => interest.profileId && router.push(`/profile/${interest.profileId}`)}
                >
                  <AvatarImage src={interest.profilePicture} />
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">?</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground line-clamp-1">{interest.title}</p>
                  {interest.message && (
                    <p className="text-xs text-muted-foreground line-clamp-1">"{interest.message}"</p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <Badge
                      className={`text-[10px] px-2 py-0 border-0 ${
                        interest.status === 'ACCEPTED' ? 'bg-green-500/10 text-green-500' :
                        interest.status === 'REJECTED' ? 'bg-destructive/10 text-destructive' :
                        'bg-muted text-muted-foreground'
                      }`}
                    >
                      {interest.status === 'ACCEPTED' ? '✓ Aceptado' :
                       interest.status === 'REJECTED' ? '✗ Rechazado' : '⏳ Pendiente'}
                    </Badge>
                    {interest.dateStatus === 'DATE_EXPIRED' && (
                      <Badge className="text-[10px] px-2 py-0 border-0 bg-muted text-muted-foreground">
                        Cita expirada
                      </Badge>
                    )}
                  </div>
                </div>
                {interest.status === 'ACCEPTED' && (
                  <button
                    onClick={() => router.push('/chat')}
                    className="shrink-0 h-8 w-8 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors"
                  >
                    <ChevronRight className="h-4 w-4 text-primary" />
                  </button>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Dialog crear cita */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Crear cita
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Título *</label>
              <Input
                value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="Ej: Café tranquilo esta tarde"
                maxLength={100}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Mensaje (opcional)</label>
              <Textarea
                value={form.message}
                onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                placeholder="Cuéntales más sobre la cita..."
                className="resize-none min-h-20"
                maxLength={700}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Fecha y hora *</label>
                <Input
                  type="datetime-local"
                  value={form.dateTime}
                  onChange={e => setForm(p => ({ ...p, dateTime: e.target.value }))}
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Zona *</label>
                <Input
                  value={form.locationZone}
                  onChange={e => setForm(p => ({ ...p, locationZone: e.target.value }))}
                  placeholder="Ej: Centro, Zona Norte"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Categoría *</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setForm(p => ({ ...p, category: cat }))}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      form.category === cat
                        ? 'bg-primary text-black border-primary font-bold'
                        : 'border-border text-muted-foreground hover:border-primary/50'
                    }`}
                  >
                    {CATEGORY_LABELS[cat]}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Planes * (selecciona al menos uno)</label>
              <div className="flex flex-wrap gap-2">
                {PLANS.map(plan => (
                  <button
                    key={plan}
                    onClick={() => togglePlan(plan)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      form.plans.includes(plan)
                        ? 'bg-secondary text-black border-secondary font-bold'
                        : 'border-border text-muted-foreground hover:border-secondary/50'
                    }`}
                  >
                    {PLAN_LABELS[plan]}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Detalle adicional</label>
              <Input
                value={form.detail}
                onChange={e => setForm(p => ({ ...p, detail: e.target.value }))}
                placeholder="Cualquier detalle extra..."
                maxLength={200}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="flex-1">
                Cancelar
              </Button>
              <Button
                onClick={handleCreate}
                disabled={creating}
                className="flex-1 bg-gradient-to-r from-primary to-secondary text-black font-bold"
              >
                {creating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Crear cita
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog enviar interés */}
      <Dialog open={!!showInterestDialog} onOpenChange={() => setShowInterestDialog(null)}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle>Enviar interés</DialogTitle>
          </DialogHeader>
          {showInterestDialog && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-muted/50 border border-border">
                <p className="text-sm font-semibold text-foreground">{showInterestDialog.title}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {format(new Date(showInterestDialog.dateTime), "d MMM, HH:mm", { locale: es })} · {showInterestDialog.locationZone}
                </p>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Mensaje (opcional)</label>
                <Textarea
                  value={interestMessage}
                  onChange={e => setInterestMessage(e.target.value)}
                  placeholder="Preséntate o di algo sobre ti..."
                  className="resize-none min-h-20"
                  maxLength={300}
                />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowInterestDialog(null)} className="flex-1">
                  Cancelar
                </Button>
                <Button
                  onClick={handleSendInterest}
                  disabled={sendingInterest}
                  className="flex-1 bg-gradient-to-r from-primary to-secondary text-black font-bold"
                >
                  {sendingInterest ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Heart className="h-4 w-4 mr-1" />}
                  Enviar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
