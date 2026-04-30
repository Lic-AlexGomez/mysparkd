"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Crown, Eye, Loader2, Search, UserCheck } from "lucide-react"
import { managerService, type ManagerUserRow } from "@/lib/services/manager"
import { toast } from "sonner"

const STATUS_COLORS: Record<string, string> = {
  activo: "bg-emerald-500/15 text-emerald-500",
  advertido: "bg-amber-500/15 text-amber-500",
  baneado: "bg-rose-500/15 text-rose-500",
}

export function ManagerUsers() {
  const [rows, setRows] = useState<ManagerUserRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("todos")
  const [selected, setSelected] = useState<string | null>(null)

  const load = async (nextPage = 0) => {
    try {
      setIsLoading(true)
      const data = await managerService.users({ username: search || undefined, page: nextPage, size: 20 })
      const content = data.content || []
      setRows(content)
      setPage(nextPage)
      setTotalPages(data.totalPages || 0)
    } catch (error: any) {
      toast.error(error?.message || "No se pudo cargar usuarios manager")
      setRows([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const t = setTimeout(() => {
      void load(0)
    }, 250)
    return () => clearTimeout(t)
  }, [search])

  const filtered = useMemo(() => rows.filter((u) => {
    const status =
      u.locked ? "baneado" : u.enabled === false ? "advertido" : "activo"
    const matchSearch = (u.username || "").toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === "todos" || status === filter
    return matchSearch && matchFilter
  }), [rows, search, filter])

  const selectedUser = filtered.find((u) => u.userId === selected)

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex items-center gap-2 flex-wrap">
        {["todos", "activo", "advertido", "baneado"].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors capitalize ${
              filter === f ? "bg-secondary text-white border-secondary" : "border-border text-muted-foreground hover:border-secondary"
            }`}
          >
            {f}
          </button>
        ))}
        <div className="relative ml-auto">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar usuario..." className="pl-8 h-8 text-xs bg-muted border-border w-48" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Lista */}
        <Card className="border-border lg:col-span-2">
          <CardContent className="p-0">
            <div className="grid grid-cols-5 gap-2 px-4 py-2 border-b border-border text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
              <span className="col-span-2">Usuario</span><span>Estado</span><span>Posts</span><span>Acciones</span>
            </div>
            <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
              {filtered.map(u => (
                <div
                  key={u.userId}
                  onClick={() => setSelected(u.userId === selected ? null : u.userId)}
                  className={`grid grid-cols-5 gap-2 px-4 py-3 items-center cursor-pointer transition-colors ${selected === u.userId ? "bg-secondary/5 border-l-2 border-secondary" : "hover:bg-muted/20"}`}
                >
                  <div className="col-span-2 flex items-center gap-2 min-w-0">
                    <div className="h-7 w-7 rounded-full bg-gradient-to-br from-secondary/30 to-accent/30 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold">{u.username[0].toUpperCase()}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate flex items-center gap-1">
                        @{u.username} {u.premium && <Crown className="h-3 w-3 text-amber-500 shrink-0" />}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{u.email || "—"}</p>
                    </div>
                  </div>
                  <Badge className={`text-[10px] border-0 w-fit ${STATUS_COLORS[u.locked ? "baneado" : u.enabled === false ? "advertido" : "activo"]}`}>
                    {u.locked ? "baneado" : u.enabled === false ? "advertido" : "activo"}
                  </Badge>
                  <span className="text-xs font-bold text-muted-foreground">{u.postCount ?? 0}</span>
                  <div className="flex gap-1">
                    <button className="h-6 w-6 rounded-lg bg-muted flex items-center justify-center hover:bg-primary/20 transition-colors" title="Ver perfil">
                      <Eye className="h-3 w-3 text-muted-foreground" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Detalle */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-secondary" />
              {selectedUser ? `@${selectedUser.username}` : "Selecciona un usuario"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedUser ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-secondary/30 to-accent/30 flex items-center justify-center">
                    <span className="text-lg font-black">{selectedUser.username[0].toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">@{selectedUser.username}</p>
                    <p className="text-xs text-muted-foreground">@{selectedUser.username}</p>
                    <Badge className={`text-[10px] border-0 mt-1 ${STATUS_COLORS[selectedUser.locked ? "baneado" : selectedUser.enabled === false ? "advertido" : "activo"]}`}>
                      {selectedUser.locked ? "baneado" : selectedUser.enabled === false ? "advertido" : "activo"}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-1.5 text-xs border-t border-border pt-3">
                  {[
                    ["Registrado",  selectedUser.fechaRegistro || "—"],
                    ["User ID", selectedUser.userId],
                    ["Posts",       selectedUser.postCount ?? 0],
                    ["Email",     selectedUser.email || "—"],
                    ["Enabled",    selectedUser.enabled === false ? "No" : "Sí"],
                    ["Premium",     selectedUser.premium ? "Sí" : "No"],
                  ].map(([k, v]) => (
                    <div key={k as string} className="flex justify-between">
                      <span className="text-muted-foreground mr-2">{k}</span>
                      <span className="font-semibold text-foreground text-right break-all">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-8">
                Haz clic en un usuario para ver sus detalles
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
