"use client"

import { useEffect, useMemo, useState } from "react"
import { trelloService, type TrelloBoard, type TrelloCard, type TrelloList } from "@/lib/services/trello"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, ExternalLink, LayoutList, RefreshCcw } from "lucide-react"
import { toast } from "sonner"
import { useFeatureFlags } from "@/hooks/use-feature-flags"
import { useRouter } from "next/navigation"
import { useI18n } from "@/lib/i18n"

export default function TrelloPage() {
  const { te } = useI18n()
  const router = useRouter()
  const features = useFeatureFlags()
  const [boards, setBoards] = useState<TrelloBoard[]>([])
  const [selectedBoardId, setSelectedBoardId] = useState<string>("")
  const [lists, setLists] = useState<TrelloList[]>([])
  const [cards, setCards] = useState<TrelloCard[]>([])
  const [loadingBoards, setLoadingBoards] = useState(true)
  const [loadingCards, setLoadingCards] = useState(false)

  const selectedBoard = useMemo(
    () => boards.find((b) => b.id === selectedBoardId) || null,
    [boards, selectedBoardId]
  )

  const listNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const list of lists) map.set(list.id, list.name)
    return map
  }, [lists])

  const fetchBoards = async () => {
    setLoadingBoards(true)
    try {
      const rows = await trelloService.getMyBoards()
      const openBoards = rows.filter((b) => !b.closed)
      setBoards(openBoards)
      if (!selectedBoardId && openBoards.length > 0) {
        setSelectedBoardId(openBoards[0].id)
      }
    } catch (error: any) {
      toast.error(error?.message || te("No se pudieron cargar los tableros de Trello", "Could not load Trello boards"))
    } finally {
      setLoadingBoards(false)
    }
  }

  const fetchBoardData = async (boardId: string) => {
    setLoadingCards(true)
    try {
      const [listRows, cardRows] = await Promise.all([
        trelloService.getBoardLists(boardId),
        trelloService.getBoardCards(boardId),
      ])
      setLists(listRows.filter((l) => !l.closed))
      setCards(cardRows.filter((c) => !c.closed))
    } catch (error: any) {
      toast.error(error?.message || te("No se pudo cargar el contenido del tablero", "Could not load board content"))
      setLists([])
      setCards([])
    } finally {
      setLoadingCards(false)
    }
  }

  useEffect(() => {
    if (!features.trelloPage) {
      toast.error(te("Esta opción está disponible solo para test1", "This option is available only for test1"))
      router.replace("/feed")
      return
    }
    void fetchBoards()
  }, [features.trelloPage, router])

  useEffect(() => {
    if (!features.trelloPage) return
    if (!selectedBoardId) return
    void fetchBoardData(selectedBoardId)
  }, [selectedBoardId, features.trelloPage])

  if (!features.trelloPage) return null

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <LayoutList className="h-5 w-5 text-primary" />
            Trello
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loadingBoards ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {te("Cargando tableros...", "Loading boards...")}
            </div>
          ) : boards.length === 0 ? (
            <p className="text-sm text-muted-foreground">{te("No se encontraron tableros disponibles.", "No available boards found.")}</p>
          ) : (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Select value={selectedBoardId} onValueChange={setSelectedBoardId}>
                <SelectTrigger className="w-full sm:w-[360px]">
                  <SelectValue placeholder={te("Selecciona un tablero", "Select a board")} />
                </SelectTrigger>
                <SelectContent>
                  {boards.map((board) => (
                    <SelectItem key={board.id} value={board.id}>
                      {board.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={() => void fetchBoards()} disabled={loadingBoards}>
                <RefreshCcw className="h-4 w-4 mr-2" />
                {te("Refrescar", "Refresh")}
              </Button>

              {selectedBoard?.url && (
                <Button variant="ghost" asChild>
                  <a href={selectedBoard.url} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    {te("Abrir tablero", "Open board")}
                  </a>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{te("Cards del tablero", "Board cards")}</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingCards ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {te("Cargando cards...", "Loading cards...")}
            </div>
          ) : cards.length === 0 ? (
            <p className="text-sm text-muted-foreground">{te("No hay cards para mostrar en este tablero.", "No cards to display on this board.")}</p>
          ) : (
            <div className="space-y-2">
              {cards.map((card) => (
                <div key={card.id} className="rounded-md border border-border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-sm text-foreground">{card.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {te("Lista", "List")}: {listNameById.get(card.idList) || te("Sin lista", "No list")}
                        {card.due ? ` · Due: ${new Date(card.due).toLocaleString()}` : ""}
                      </p>
                    </div>
                    <a href={card.url} target="_blank" rel="noreferrer" className="text-primary hover:underline text-xs">
                      {te("Ver", "View")}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

