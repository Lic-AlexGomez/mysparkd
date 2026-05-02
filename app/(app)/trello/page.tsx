"use client"

import { useEffect, useMemo, useState } from "react"
import { trelloService, type TrelloBoard, type TrelloCard, type TrelloLabel, type TrelloList } from "@/lib/services/trello"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ExternalLink, Loader2, LayoutList, RefreshCcw, Plus, MoreHorizontal,
  Archive, MoveRight, Pencil, X, Calendar,
} from "lucide-react"
import { toast } from "sonner"
import { useFeatureFlags } from "@/hooks/use-feature-flags"
import { useRouter } from "next/navigation"
import { useI18n } from "@/lib/i18n"

const LABEL_COLORS: Record<string, string> = {
  green: "bg-green-500",
  yellow: "bg-yellow-400",
  orange: "bg-orange-500",
  red: "bg-red-500",
  purple: "bg-purple-500",
  blue: "bg-blue-500",
  sky: "bg-sky-400",
  lime: "bg-lime-500",
  pink: "bg-pink-500",
  black: "bg-gray-800",
}

export default function TrelloPage() {
  const { te } = useI18n()
  const router = useRouter()
  const features = useFeatureFlags()

  const [boards, setBoards] = useState<TrelloBoard[]>([])
  const [selectedBoardId, setSelectedBoardId] = useState("")
  const [lists, setLists] = useState<TrelloList[]>([])
  const [cards, setCards] = useState<TrelloCard[]>([])
  const [labels, setLabels] = useState<TrelloLabel[]>([])
  const [loadingBoards, setLoadingBoards] = useState(true)
  const [loadingCards, setLoadingCards] = useState(false)

  // Create card dialog
  const [createListId, setCreateListId] = useState<string | null>(null)
  const [newCardName, setNewCardName] = useState("")
  const [newCardDesc, setNewCardDesc] = useState("")
  const [newCardDue, setNewCardDue] = useState("")
  const [newCardLabels, setNewCardLabels] = useState<string[]>([])
  const [creating, setCreating] = useState(false)

  // Edit card dialog
  const [editCard, setEditCard] = useState<TrelloCard | null>(null)
  const [editName, setEditName] = useState("")
  const [editDesc, setEditDesc] = useState("")
  const [editDue, setEditDue] = useState("")
  const [editLabels, setEditLabels] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  // Move card dialog
  const [moveCard, setMoveCard] = useState<TrelloCard | null>(null)
  const [moveTargetListId, setMoveTargetListId] = useState("")
  const [moving, setMoving] = useState(false)

  const selectedBoard = useMemo(() => boards.find((b) => b.id === selectedBoardId) || null, [boards, selectedBoardId])

  const cardsByList = useMemo(() => {
    const map = new Map<string, TrelloCard[]>()
    for (const list of lists) map.set(list.id, [])
    for (const card of cards) {
      if (!card.closed) {
        const arr = map.get(card.idList) || []
        arr.push(card)
        map.set(card.idList, arr)
      }
    }
    return map
  }, [lists, cards])

  const labelById = useMemo(() => {
    const map = new Map<string, TrelloLabel>()
    for (const l of labels) map.set(l.id, l)
    return map
  }, [labels])

  const fetchBoards = async () => {
    setLoadingBoards(true)
    try {
      const rows = await trelloService.getMyBoards()
      const open = rows.filter((b) => !b.closed)
      setBoards(open)
      if (!selectedBoardId && open.length > 0) setSelectedBoardId(open[0].id)
    } catch (e: any) {
      toast.error(e?.message || te("No se pudieron cargar los tableros", "Could not load boards"))
    } finally {
      setLoadingBoards(false)
    }
  }

  const fetchBoardData = async (boardId: string) => {
    setLoadingCards(true)
    try {
      const [listRows, cardRows, labelRows] = await Promise.all([
        trelloService.getBoardLists(boardId),
        trelloService.getBoardCards(boardId),
        trelloService.getBoardLabels(boardId),
      ])
      setLists(listRows.filter((l) => !l.closed))
      setCards(cardRows)
      setLabels(labelRows)
    } catch (e: any) {
      toast.error(e?.message || te("No se pudo cargar el tablero", "Could not load board"))
    } finally {
      setLoadingCards(false)
    }
  }

  useEffect(() => {
    if (!features.trelloPage) { router.replace("/feed"); return }
    void fetchBoards()
  }, [features.trelloPage])

  useEffect(() => {
    if (!selectedBoardId || !features.trelloPage) return
    void fetchBoardData(selectedBoardId)
  }, [selectedBoardId])

  const openCreateDialog = (listId: string) => {
    setCreateListId(listId)
    setNewCardName("")
    setNewCardDesc("")
    setNewCardDue("")
    setNewCardLabels([])
  }

  const handleCreate = async () => {
    if (!newCardName.trim() || !createListId) return
    setCreating(true)
    try {
      const created = await trelloService.createCard(
        createListId,
        newCardName.trim(),
        newCardDesc.trim() || undefined,
        newCardDue || undefined,
        newCardLabels.length ? newCardLabels : undefined,
      )
      setCards((prev) => [...prev, created])
      setCreateListId(null)
      toast.success(te("Card creada", "Card created"))
    } catch (e: any) {
      toast.error(e?.message || te("No se pudo crear la card", "Could not create card"))
    } finally {
      setCreating(false)
    }
  }

  const openEditDialog = (card: TrelloCard) => {
    setEditCard(card)
    setEditName(card.name)
    setEditDesc(card.desc || "")
    setEditDue(card.due ? card.due.slice(0, 16) : "")
    setEditLabels(card.idLabels || [])
  }

  const handleSaveEdit = async () => {
    if (!editCard || !editName.trim()) return
    setSaving(true)
    try {
      const updated = await trelloService.updateCard(editCard.id, {
        name: editName.trim(),
        desc: editDesc.trim(),
        due: editDue || null,
        idLabels: editLabels,
      } as any)
      setCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
      setEditCard(null)
      toast.success(te("Card actualizada", "Card updated"))
    } catch (e: any) {
      toast.error(e?.message || te("No se pudo actualizar", "Could not update"))
    } finally {
      setSaving(false)
    }
  }

  const handleArchive = async (cardId: string) => {
    try {
      await trelloService.archiveCard(cardId)
      setCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, closed: true } : c)))
      toast.success(te("Card archivada", "Card archived"))
    } catch (e: any) {
      toast.error(e?.message || te("No se pudo archivar", "Could not archive"))
    }
  }

  const openMoveDialog = (card: TrelloCard) => {
    setMoveCard(card)
    setMoveTargetListId(card.idList)
  }

  const handleMove = async () => {
    if (!moveCard || !moveTargetListId || moveTargetListId === moveCard.idList) {
      setMoveCard(null)
      return
    }
    setMoving(true)
    try {
      const updated = await trelloService.moveCard(moveCard.id, moveTargetListId)
      setCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
      setMoveCard(null)
      toast.success(te("Card movida", "Card moved"))
    } catch (e: any) {
      toast.error(e?.message || te("No se pudo mover", "Could not move"))
    } finally {
      setMoving(false)
    }
  }

  const toggleLabel = (id: string, arr: string[], setArr: (v: string[]) => void) => {
    setArr(arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id])
  }

  if (!features.trelloPage) return null

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 space-y-4">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <LayoutList className="h-5 w-5 text-primary" />
            Trello
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingBoards ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {te("Cargando tableros...", "Loading boards...")}
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <Select value={selectedBoardId} onValueChange={setSelectedBoardId}>
                <SelectTrigger className="w-[280px]">
                  <SelectValue placeholder={te("Selecciona un tablero", "Select a board")} />
                </SelectTrigger>
                <SelectContent>
                  {boards.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={() => void fetchBoards()} disabled={loadingBoards}>
                <RefreshCcw className="h-4 w-4 mr-1" />
                {te("Refrescar", "Refresh")}
              </Button>
              {selectedBoard?.url && (
                <Button variant="ghost" size="sm" asChild>
                  <a href={selectedBoard.url} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    {te("Abrir en Trello", "Open in Trello")}
                  </a>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Kanban board */}
      {loadingCards ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
          <Loader2 className="h-5 w-5 animate-spin" />
          {te("Cargando tablero...", "Loading board...")}
        </div>
      ) : lists.length > 0 ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {lists.map((list) => {
            const listCards = cardsByList.get(list.id) || []
            return (
              <div key={list.id} className="flex-shrink-0 w-72 flex flex-col gap-2">
                {/* List header */}
                <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-muted/60 border border-border">
                  <span className="text-sm font-semibold text-foreground">{list.name}</span>
                  <Badge variant="secondary" className="text-xs">{listCards.length}</Badge>
                </div>

                {/* Cards */}
                <div className="flex flex-col gap-2">
                  {listCards.map((card) => (
                    <div key={card.id} className="rounded-xl border border-border bg-card p-3 shadow-sm hover:border-primary/40 transition-colors">
                      {/* Labels */}
                      {card.idLabels?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {card.idLabels.map((lid) => {
                            const lbl = labelById.get(lid)
                            if (!lbl) return null
                            return (
                              <span
                                key={lid}
                                className={`h-2 w-8 rounded-full ${LABEL_COLORS[lbl.color || ""] || "bg-muted"}`}
                                title={lbl.name}
                              />
                            )
                          })}
                        </div>
                      )}

                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-foreground leading-snug flex-1">{card.name}</p>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(card)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              {te("Editar", "Edit")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openMoveDialog(card)}>
                              <MoveRight className="h-4 w-4 mr-2" />
                              {te("Mover", "Move")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => window.open(card.url, "_blank")}>
                              <ExternalLink className="h-4 w-4 mr-2" />
                              {te("Ver en Trello", "View in Trello")}
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => handleArchive(card.id)}>
                              <Archive className="h-4 w-4 mr-2" />
                              {te("Archivar", "Archive")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {card.due && (
                        <p className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(card.due).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add card button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-muted-foreground hover:text-foreground"
                  onClick={() => openCreateDialog(list.id)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  {te("Agregar card", "Add card")}
                </Button>
              </div>
            )
          })}
        </div>
      ) : selectedBoardId ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          {te("No hay listas en este tablero.", "No lists in this board.")}
        </p>
      ) : null}

      {/* Create card dialog */}
      <Dialog open={!!createListId} onOpenChange={(o) => { if (!o) setCreateListId(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{te("Nueva card", "New card")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              value={newCardName}
              onChange={(e) => setNewCardName(e.target.value)}
              placeholder={te("Título de la card", "Card title")}
              autoFocus
            />
            <Textarea
              value={newCardDesc}
              onChange={(e) => setNewCardDesc(e.target.value)}
              placeholder={te("Descripción (opcional)", "Description (optional)")}
              rows={3}
              className="resize-none"
            />
            <div>
              <p className="text-xs text-muted-foreground mb-1">{te("Fecha límite (opcional)", "Due date (optional)")}</p>
              <Input type="datetime-local" value={newCardDue} onChange={(e) => setNewCardDue(e.target.value)} />
            </div>
            {labels.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">{te("Etiquetas", "Labels")}</p>
                <div className="flex flex-wrap gap-1.5">
                  {labels.filter((l) => l.name || l.color).map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => toggleLabel(l.id, newCardLabels, setNewCardLabels)}
                      className={`px-2 py-0.5 rounded text-xs font-medium border transition-all ${
                        newCardLabels.includes(l.id)
                          ? "border-primary ring-1 ring-primary opacity-100"
                          : "border-border opacity-60 hover:opacity-100"
                      } ${LABEL_COLORS[l.color || ""] || "bg-muted"} text-white`}
                    >
                      {l.name || l.color}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setCreateListId(null)}>{te("Cancelar", "Cancel")}</Button>
              <Button onClick={handleCreate} disabled={creating || !newCardName.trim()}>
                {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {te("Crear", "Create")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit card dialog */}
      <Dialog open={!!editCard} onOpenChange={(o) => { if (!o) setEditCard(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{te("Editar card", "Edit card")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder={te("Título", "Title")} />
            <Textarea
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              placeholder={te("Descripción", "Description")}
              rows={3}
              className="resize-none"
            />
            <div>
              <p className="text-xs text-muted-foreground mb-1">{te("Fecha límite", "Due date")}</p>
              <div className="flex gap-2">
                <Input type="datetime-local" value={editDue} onChange={(e) => setEditDue(e.target.value)} className="flex-1" />
                {editDue && (
                  <Button variant="ghost" size="icon" onClick={() => setEditDue("")}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            {labels.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">{te("Etiquetas", "Labels")}</p>
                <div className="flex flex-wrap gap-1.5">
                  {labels.filter((l) => l.name || l.color).map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => toggleLabel(l.id, editLabels, setEditLabels)}
                      className={`px-2 py-0.5 rounded text-xs font-medium border transition-all ${
                        editLabels.includes(l.id)
                          ? "border-primary ring-1 ring-primary opacity-100"
                          : "border-border opacity-60 hover:opacity-100"
                      } ${LABEL_COLORS[l.color || ""] || "bg-muted"} text-white`}
                    >
                      {l.name || l.color}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setEditCard(null)}>{te("Cancelar", "Cancel")}</Button>
              <Button onClick={handleSaveEdit} disabled={saving || !editName.trim()}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {te("Guardar", "Save")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Move card dialog */}
      <Dialog open={!!moveCard} onOpenChange={(o) => { if (!o) setMoveCard(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{te("Mover card", "Move card")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{moveCard?.name}</p>
            <Select value={moveTargetListId} onValueChange={setMoveTargetListId}>
              <SelectTrigger>
                <SelectValue placeholder={te("Selecciona lista destino", "Select target list")} />
              </SelectTrigger>
              <SelectContent>
                {lists.map((l) => (
                  <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setMoveCard(null)}>{te("Cancelar", "Cancel")}</Button>
              <Button onClick={handleMove} disabled={moving || moveTargetListId === moveCard?.idList}>
                {moving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {te("Mover", "Move")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
