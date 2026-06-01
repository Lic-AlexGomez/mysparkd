"use client"

import { useState } from "react"
import { Loader2, Users, User, X } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { FORM_CONTROL_INPUT, FORM_CONTROL_TEXTAREA } from "@/lib/form-field-classes"
import { cn } from "@/lib/utils"

export type JoinEligibleUser = {
  userId: string
  username: string
  fullName?: string
  photo?: string
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  availableSpots: number | null
  eligiblePool: JoinEligibleUser[]
  eligibleLoading: boolean
  onSoloJoin: (message: string) => Promise<void>
  onGroupJoin: (invitees: JoinEligibleUser[], message: string) => Promise<void>
  te: (es: string, en: string) => string
}

type Step = "choose" | "solo" | "group"

export function JoinMeetupDialog({
  open,
  onOpenChange,
  availableSpots,
  eligiblePool,
  eligibleLoading,
  onSoloJoin,
  onGroupJoin,
  te,
}: Props) {
  const [step, setStep] = useState<Step>("choose")
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState<JoinEligibleUser[]>([])
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [capacityError, setCapacityError] = useState<string | null>(null)

  const handleClose = () => {
    onOpenChange(false)
    // reset after animation
    setTimeout(() => {
      setStep("choose")
      setQuery("")
      setSelected([])
      setMessage("")
      setLoading(false)
      setCapacityError(null)
    }, 200)
  }

  const handleSolo = async () => {
    setLoading(true)
    try {
      await onSoloJoin(message)
      handleClose()
    } finally {
      setLoading(false)
    }
  }

  const handleGroup = async () => {
    if (selected.length === 0) return

    // capacity check: me (1) + invitees
    const groupSize = 1 + selected.length
    if (availableSpots !== null && groupSize > availableSpots) {
      setCapacityError(
        te(
          `No hay cupo para ${groupSize} personas. Solo quedan ${availableSpots} lugar${availableSpots === 1 ? "" : "es"}. Intenta quitando personas.`,
          `Not enough spots for ${groupSize} people. Only ${availableSpots} spot${availableSpots === 1 ? "" : "s"} left. Try removing some people.`
        )
      )
      return
    }

    setCapacityError(null)
    setLoading(true)
    try {
      await onGroupJoin(selected, message)
      handleClose()
    } finally {
      setLoading(false)
    }
  }

  const addUser = (u: JoinEligibleUser) => {
    setSelected((prev) => [...prev, u])
    setQuery("")
    setCapacityError(null)
  }

  const removeUser = (userId: string) => {
    setSelected((prev) => prev.filter((u) => u.userId !== userId))
    setCapacityError(null)
  }

  const selectedIds = new Set(selected.map((u) => u.userId))
  const filtered = eligiblePool
    .filter((u) => !selectedIds.has(u.userId))
    .filter((u) => {
      const q = query.trim().toLowerCase()
      if (!q) return true
      return (
        u.username.toLowerCase().includes(q) ||
        (u.fullName && u.fullName.toLowerCase().includes(q))
      )
    })

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md rounded-2xl p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border/60">
          <DialogTitle className="text-base font-semibold">
            {step === "choose" && te("¿Cómo quieres unirte?", "How do you want to join?")}
            {step === "solo" && te("Solicitar (solo yo)", "Request (just me)")}
            {step === "group" && te("Solicitud grupal", "Group request")}
          </DialogTitle>
        </DialogHeader>

        <div className="px-5 py-4 space-y-4">
          {/* ── STEP: CHOOSE ── */}
          {step === "choose" && (
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setStep("solo")}
                className="flex flex-col items-center gap-2 rounded-xl border border-border/70 bg-muted/40 px-4 py-5 text-center transition-colors hover:border-primary/40 hover:bg-primary/5"
              >
                <User className="size-7 text-primary" aria-hidden />
                <span className="text-sm font-semibold">{te("Solo yo", "Just me")}</span>
                <span className="text-xs text-muted-foreground">
                  {te("Solicitud individual al organizador", "Individual request to the organizer")}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setStep("group")}
                className="flex flex-col items-center gap-2 rounded-xl border border-border/70 bg-muted/40 px-4 py-5 text-center transition-colors hover:border-primary/40 hover:bg-primary/5"
              >
                <Users className="size-7 text-primary" aria-hidden />
                <span className="text-sm font-semibold">{te("Con un grupo", "With a group")}</span>
                <span className="text-xs text-muted-foreground">
                  {te("Invita a matches y seguidores mutuos", "Invite matches and mutual followers")}
                </span>
              </button>
            </div>
          )}

          {/* ── STEP: SOLO ── */}
          {step === "solo" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {te(
                  "Tu solicitud irá directamente al organizador. Puedes añadir un mensaje opcional.",
                  "Your request will go directly to the organizer. You can add an optional message."
                )}
              </p>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  {te("Mensaje (opcional)", "Message (optional)")}
                </label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={te("Preséntate al organizador…", "Introduce yourself to the organizer…")}
                  maxLength={500}
                  rows={2}
                  className={FORM_CONTROL_TEXTAREA}
                />
              </div>
              <div className="flex gap-2 pt-1">
                <Button variant="outline" size="sm" onClick={() => setStep("choose")} disabled={loading}>
                  {te("Volver", "Back")}
                </Button>
                <Button size="sm" onClick={handleSolo} disabled={loading} className="flex-1">
                  {loading ? <Loader2 className="mr-2 size-4 animate-spin" aria-hidden /> : null}
                  {te("Enviar solicitud", "Send request")}
                </Button>
              </div>
            </div>
          )}

          {/* ── STEP: GROUP ── */}
          {step === "group" && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {te(
                  "Todos los que invites deben aceptar antes de que la solicitud llegue al organizador. Si alguien rechaza, la solicitud se cancela.",
                  "Everyone you invite must accept before the request reaches the organizer. If anyone declines, the request is cancelled."
                )}
              </p>

              {/* Search */}
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={te("Buscar por nombre o @usuario…", "Search by name or @username…")}
                className={FORM_CONTROL_INPUT}
              />

              {/* Results */}
              {eligibleLoading ? (
                <div className="flex items-center gap-2 py-3 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  {te("Cargando matches y seguidores mutuos…", "Loading matches and mutual followers…")}
                </div>
              ) : filtered.length === 0 && eligiblePool.length === 0 ? (
                <p className="py-2 text-sm text-muted-foreground">
                  {te(
                    "No tienes matches ni seguidores mutuos disponibles para invitar.",
                    "You have no available matches or mutual followers to invite."
                  )}
                </p>
              ) : filtered.length === 0 ? (
                <p className="py-1 text-sm text-muted-foreground">
                  {te("Nadie coincide con la búsqueda.", "No one matches the search.")}
                </p>
              ) : (
                <div className="max-h-44 divide-y divide-border overflow-auto rounded-xl border border-border">
                  {filtered.map((u) => (
                    <button
                      key={u.userId}
                      type="button"
                      onClick={() => addUser(u)}
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/70"
                    >
                      <Avatar className="size-8 shrink-0">
                        {u.photo ? <AvatarImage src={u.photo} alt="" className="object-cover" /> : null}
                        <AvatarFallback className="text-xs font-bold">
                          {(u.username || u.userId)[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{u.fullName || `@${u.username}`}</p>
                        <p className="truncate text-xs text-muted-foreground">@{u.username}</p>
                      </div>
                      <span className="shrink-0 text-xs font-medium text-primary">
                        {te("Añadir", "Add")}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Selected chips */}
              {selected.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    {te(`${selected.length} en tu grupo (+ tú = ${selected.length + 1} en total)`, `${selected.length} in your group (+ you = ${selected.length + 1} total)`)}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.map((u) => (
                      <Badge
                        key={u.userId}
                        variant="secondary"
                        className="gap-1 cursor-pointer pr-1 hover:bg-destructive/15"
                        onClick={() => removeUser(u.userId)}
                      >
                        <Avatar className="size-4">
                          {u.photo ? <AvatarImage src={u.photo} alt="" className="object-cover" /> : null}
                          <AvatarFallback className="text-[8px]">{u.username[0].toUpperCase()}</AvatarFallback>
                        </Avatar>
                        @{u.username}
                        <X className="size-3 opacity-60" aria-hidden />
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Message */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  {te("Mensaje para el organizador (opcional)", "Message to the organizer (optional)")}
                </label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={te("Cuéntale algo sobre tu grupo…", "Tell them something about your group…")}
                  maxLength={500}
                  rows={2}
                  className={FORM_CONTROL_TEXTAREA}
                />
              </div>

              {/* Capacity error */}
              {capacityError && (
                <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
                  {capacityError}
                </p>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <Button variant="outline" size="sm" onClick={() => setStep("choose")} disabled={loading}>
                  {te("Volver", "Back")}
                </Button>
                <Button
                  size="sm"
                  onClick={handleGroup}
                  disabled={loading || selected.length === 0}
                  className="flex-1"
                >
                  {loading ? <Loader2 className="mr-2 size-4 animate-spin" aria-hidden /> : null}
                  {selected.length === 0
                    ? te("Añade al menos 1 persona", "Add at least 1 person")
                    : te(`Enviar solicitud grupal (${selected.length + 1})`, `Send group request (${selected.length + 1})`)}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
