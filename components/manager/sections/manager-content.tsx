"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { FileText, Loader2, Search, ShieldAlert, Trash2, Undo2, Eye } from "lucide-react"
import { managerService, type ManagerPostReport } from "@/lib/services/manager"
import { toast } from "sonner"

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-500/15 text-amber-500",
  ACTION_TAKEN: "bg-rose-500/15 text-rose-500",
  REJECTED: "bg-muted text-muted-foreground",
}

export function ManagerContent() {
  const [rows, setRows] = useState<ManagerPostReport[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("PENDING")
  const [selected, setSelected] = useState<string | null>(null)

  const load = async (nextPage = 0) => {
    try {
      setIsLoading(true)
      const data = await managerService.contentQueue({ page: nextPage, size: 20 })
      const content = data.content || []
      setRows(content)
      setPage(nextPage)
      setTotalPages(data.totalPages || 0)
    } catch (error: any) {
      toast.error(error?.message || "No se pudo cargar la cola de moderación")
      setRows([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void load(0)
  }, [])

  const filtered = useMemo(() => rows.filter((p) => {
    const haystack = `${p.reportedUsername || ""} ${p.reporterUsername || ""} ${p.reason || ""}`.toLowerCase()
    const matchSearch = haystack.includes(search.toLowerCase()) || p.targetId.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === "todos" || p.status === filter
    return matchSearch && matchFilter
  }), [rows, search, filter])

  const selectedPost = filtered.find((p) => p.reportId === selected)

  const runAction = async (kind: "hide" | "restore" | "delete", targetId: string) => {
    const label = kind === "hide" ? "ocultar" : kind === "restore" ? "restaurar" : "eliminar"
    const ok =
      kind === "delete"
        ? window.confirm(`¿Seguro que deseas ${label} este post? (acción irreversible)`)
        : window.confirm(`¿Seguro que deseas ${label} este post?`)
    if (!ok) return

    setActionLoadingId(targetId)
    try {
      if (kind === "hide") await managerService.hidePost(targetId)
      if (kind === "restore") await managerService.restorePost(targetId)
      if (kind === "delete") await managerService.deletePost(targetId)
      toast.success(`Acción aplicada: ${kind}`)
      await load(page)
    } catch (error: any) {
      toast.error(error?.message || "No se pudo ejecutar la acción")
    } finally {
      setActionLoadingId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        {["todos", "PENDING", "ACTION_TAKEN", "REJECTED"].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors capitalize ${
              filter === f ? "bg-secondary text-white border-secondary" : "border-border text-muted-foreground hover:border-secondary"
            }`}
          >
            {f.toLowerCase()}
          </button>
        ))}
        <div className="relative ml-auto">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar post..." className="pl-8 h-8 text-xs bg-muted border-border w-48" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="border-border lg:col-span-2">
          <CardContent className="p-0">
            <div className="grid grid-cols-5 gap-2 px-4 py-2 border-b border-border text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
              <span className="col-span-2">Reporte</span><span>Estado</span><span>Tipo</span><span>Acciones</span>
            </div>
            <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
              {filtered.map(p => {
                return (
                  <div
                    key={p.reportId}
                    onClick={() => setSelected(p.reportId === selected ? null : p.reportId)}
                    className={`grid grid-cols-5 gap-2 px-4 py-3 items-center cursor-pointer transition-colors ${selected === p.reportId ? "bg-secondary/5 border-l-2 border-secondary" : "hover:bg-muted/20"}`}
                  >
                    <div className="col-span-2 flex items-center gap-2 min-w-0">
                      <div className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <ShieldAlert className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-foreground truncate">@{p.reportedUsername || "unknown"} reportado por @{p.reporterUsername || "unknown"}</p>
                        <p className="text-[10px] text-muted-foreground">{p.reason || "Sin motivo"} · {new Date(p.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge className={`text-[10px] border-0 ${STATUS_COLORS[p.status] || "bg-muted text-muted-foreground"}`}>{p.status}</Badge>
                    </div>
                    <span className="text-xs text-foreground font-medium">{p.targetType}</span>
                    <div className="flex gap-1">
                      <button className="h-6 w-6 rounded-lg bg-muted flex items-center justify-center hover:bg-primary/20 transition-colors">
                        <Eye className="h-3 w-3 text-muted-foreground" />
                      </button>
                      <button
                        className="h-6 w-6 rounded-lg bg-muted flex items-center justify-center hover:bg-rose-500/20 transition-colors disabled:opacity-50"
                        disabled={actionLoadingId === p.targetId}
                        onClick={(e) => {
                          e.stopPropagation()
                          void runAction("delete", p.targetId)
                        }}
                      >
                        <Trash2 className="h-3 w-3 text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Detalle */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4 text-secondary" />
              {selectedPost ? "Detalle del post" : "Selecciona un post"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedPost ? (
              <div className="space-y-3">
                <div className={`p-3 rounded-xl border ${selectedPost.status === "PENDING" ? "border-rose-500/30 bg-rose-500/5" : "border-border bg-muted/20"}`}>
                  <p className="text-xs text-foreground">Target ID: {selectedPost.targetId}</p>
                </div>
                <div className="space-y-1.5 text-xs">
                  {[
                    ["Reportado",    `@${selectedPost.reportedUsername || "unknown"}`],
                    ["Reporter",    `@${selectedPost.reporterUsername || "unknown"}`],
                    ["Tipo",     selectedPost.targetType],
                    ["Estado",   selectedPost.status],
                    ["Motivo",    selectedPost.reason || "Sin motivo"],
                    ["Fecha",    new Date(selectedPost.createdAt).toLocaleString()],
                  ].map(([k, v]) => (
                    <div key={k as string} className="flex justify-between">
                      <span className="text-muted-foreground">{k}</span>
                      <span className="font-semibold text-foreground text-right break-all">{v}</span>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-2 pt-2 border-t border-border">
                  <Button size="sm" variant="outline" className="w-full text-xs h-8">
                    <Eye className="h-3.5 w-3.5 mr-1.5" /> Ver post completo
                  </Button>
                  <Button size="sm" variant="outline" className="w-full text-xs h-8 border-amber-500/30 text-amber-500 hover:bg-amber-500/10" disabled={actionLoadingId === selectedPost.targetId} onClick={() => void runAction("hide", selectedPost.targetId)}>
                    <ShieldAlert className="h-3.5 w-3.5 mr-1.5" /> Ocultar post
                  </Button>
                  <Button size="sm" variant="outline" className="w-full text-xs h-8 border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10" disabled={actionLoadingId === selectedPost.targetId} onClick={() => void runAction("restore", selectedPost.targetId)}>
                    <Undo2 className="h-3.5 w-3.5 mr-1.5" /> Restaurar post
                  </Button>
                  <Button size="sm" variant="outline" className="w-full text-xs h-8 border-rose-500/30 text-rose-500 hover:bg-rose-500/10" disabled={actionLoadingId === selectedPost.targetId} onClick={() => void runAction("delete", selectedPost.targetId)}>
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Eliminar post
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-8">
                Haz clic en un post para ver sus detalles
              </p>
            )}
          </CardContent>
        </Card>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button variant="outline" disabled={page <= 0} onClick={() => void load(page - 1)}>
            Anterior
          </Button>
          <p className="text-xs text-muted-foreground">Página {page + 1} de {totalPages}</p>
          <Button variant="outline" disabled={page + 1 >= totalPages} onClick={() => void load(page + 1)}>
            Siguiente
          </Button>
        </div>
      )}
    </div>
  )
}
