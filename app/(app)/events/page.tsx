"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { eventService } from "@/lib/services/event"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, Link2, Loader2, MapPin, Users } from "lucide-react"
import type { Event } from "@/lib/types"
import { toast } from "sonner"

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

export default function EventsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [items, setItems] = useState<EventView[]>([])
  const [joinToken, setJoinToken] = useState("")
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState<string>("ALL")
  const [freeOnly, setFreeOnly] = useState<string>("ALL")
  const [joiningEventId, setJoiningEventId] = useState<string | null>(null)

  const loadEvents = async () => {
    setIsLoading(true)
    try {
      const rows = await eventService.list({
        category: category !== "ALL" ? (category as any) : undefined,
        free: freeOnly === "ALL" ? undefined : freeOnly === "TRUE",
      })
      setItems((Array.isArray(rows) ? rows : []).map(normalizeEvent))
    } catch (error: any) {
      toast.error(error?.message || "No se pudieron cargar los eventos")
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
      toast.success("Te uniste al evento por invitación")
      setJoinToken("")
      await loadEvents()
    } catch (error: any) {
      toast.error(error?.message || "No se pudo usar el link")
    }
  }

  const handleJoinEvent = async (eventId: string) => {
    setJoiningEventId(eventId)
    try {
      await eventService.join(eventId)
      toast.success("Solicitud enviada")
      router.push(`/events/${eventId}`)
    } catch (error: any) {
      toast.error(error?.message || "No se pudo unir")
    } finally {
      setJoiningEventId(null)
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-6 flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <CalendarDays className="h-6 w-6 text-primary" />
          Eventos
        </h1>
        <p className="text-muted-foreground">Explora eventos y su chat grupal en tiempo real.</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            Unirme por link de invitación
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={joinToken}
            onChange={(e) => setJoinToken(e.target.value)}
            placeholder="Pega aquí el token o URL de invitación"
          />
          <Button onClick={handleJoinByLink} className="w-full sm:w-auto">Unirme</Button>
        </CardContent>
      </Card>

      <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-4">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por título/categoría"
          className="sm:col-span-2"
        />
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger>
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todas</SelectItem>
            {eventService.enums.categories.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={freeOnly} onValueChange={setFreeOnly}>
          <SelectTrigger>
            <SelectValue placeholder="Gratis/Pago" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos</SelectItem>
            <SelectItem value="TRUE">Gratis</SelectItem>
            <SelectItem value="FALSE">Pago</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border p-10 text-center text-muted-foreground">
          No hay eventos con esos filtros.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((event) => {
            const available = Math.max(
              0,
              Number(event.maxGuests || 0) - Number(event.currentApprovedCount || 0)
            )
            return (
              <Card key={event._id} className="hover:border-primary/40 transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg">{event._title}</CardTitle>
                    <Badge variant="outline">{event.status || "OPEN"}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{event._description || "Sin descripción"}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {event.category && <Badge className="bg-primary/10 text-primary border-0">{event.category}</Badge>}
                    {event.free === true && <Badge className="bg-green-500/15 text-green-500 border-0">Gratis</Badge>}
                    {event.free === false && <Badge className="bg-amber-500/15 text-amber-500 border-0">Pago</Badge>}
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {event.currentApprovedCount || 0}/{event.maxGuests || "∞"} participantes
                    </p>
                    <p className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Cupos: {event.maxGuests ? available : "Ilimitado"}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => router.push(`/events/${event._id}`)}
                    >
                      Ver detalle
                    </Button>
                    <Button
                      className="w-full"
                      onClick={() => handleJoinEvent(event._id)}
                      disabled={joiningEventId === event._id}
                    >
                      {joiningEventId === event._id ? "Uniendo..." : "Unirme"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
