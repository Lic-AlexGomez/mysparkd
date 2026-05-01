"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { StatCard } from "./shared"
import { Loader2, ScrollText, Search } from "lucide-react"
import { adminService, type AuditLogRow } from "@/lib/services/admin"
import { toast } from "sonner"

const toIsoOrUndefined = (local: string) => {
  const v = local.trim()
  if (!v) return undefined
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return undefined
  return d.toISOString()
}

export function AdminAuditLog() {
  const [rows, setRows] = useState<AuditLogRow[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [fromLocal, setFromLocal] = useState("")
  const [toLocal, setToLocal] = useState("")
  const [actorId, setActorId] = useState("")
  const [actionFilter, setActionFilter] = useState("")
  const [search, setSearch] = useState("")

  const load = useCallback(async (nextPage = 0) => {
    setLoading(true)
    try {
      const data = await adminService.getAuditLog({
        from: toIsoOrUndefined(fromLocal),
        to: toIsoOrUndefined(toLocal),
        actorId: actorId.trim() || undefined,
        action: actionFilter.trim() || undefined,
        page: nextPage,
        size: 50,
      })
      setRows(Array.isArray(data.content) ? data.content : [])
      setPage(data.number ?? nextPage)
      setTotalPages(data.totalPages ?? 0)
      setTotalElements(data.totalElements ?? 0)
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "No se pudo cargar el audit log"
      toast.error(msg)
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [fromLocal, toLocal, actorId, actionFilter])

  useEffect(() => {
    void load(0)
  }, [load])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) => {
      const hay = `${r.action} ${r.actorUsername || ""} ${r.detail || ""} ${r.targetType || ""} ${r.targetId || ""}`.toLowerCase()
      return hay.includes(q)
    })
  }, [rows, search])

  const uniqueActors = useMemo(() => new Set(rows.map((r) => r.actorUsername).filter(Boolean)).size, [rows])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Eventos (página)" value={String(rows.length)} icon={ScrollText} color="bg-primary" />
        <StatCard label="Total (API)" value={String(totalElements)} icon={ScrollText} color="bg-violet-500" />
        <StatCard label="Páginas" value={String(totalPages)} icon={ScrollText} color="bg-amber-500" />
        <StatCard label="Actores únicos (vista)" value={String(uniqueActors)} icon={ScrollText} color="bg-emerald-500" />
      </div>

      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-5">
          <div>
            <p className="text-[11px] text-muted-foreground mb-1">Desde</p>
            <Input type="datetime-local" value={fromLocal} onChange={(e) => setFromLocal(e.target.value)} className="h-9 text-xs" />
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground mb-1">Hasta</p>
            <Input type="datetime-local" value={toLocal} onChange={(e) => setToLocal(e.target.value)} className="h-9 text-xs" />
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground mb-1">Actor ID</p>
            <Input value={actorId} onChange={(e) => setActorId(e.target.value)} placeholder="UUID" className="h-9 text-xs" />
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground mb-1">Acción (contiene)</p>
            <Input value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} className="h-9 text-xs" />
          </div>
          <div className="flex items-end gap-2">
            <Button type="button" className="h-9 flex-1" onClick={() => void load(0)}>
              Aplicar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <CardTitle className="text-sm flex items-center gap-2">
              <ScrollText className="h-4 w-4 text-primary" /> Auditoría (API)
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar en esta página…"
                className="pl-7 h-8 text-xs bg-muted border-border w-48"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-6 gap-2 px-4 py-2 border-b border-border text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                <span>Fecha</span>
                <span>Actor</span>
                <span className="col-span-2">Acción</span>
                <span>Objetivo</span>
                <span>IP</span>
              </div>
              <div className="divide-y divide-border max-h-[520px] overflow-y-auto">
                {filtered.map((l) => (
                  <div key={l.id} className="grid grid-cols-6 gap-2 px-4 py-2.5 items-start hover:bg-muted/20 transition-colors text-xs">
                    <span className="text-[11px] font-mono text-muted-foreground">
                      {new Date(l.createdAt).toLocaleString()}
                    </span>
                    <span className="text-foreground truncate">@{l.actorUsername || "—"}</span>
                    <span className="col-span-2 text-foreground break-words">{l.action}</span>
                    <div className="flex flex-col gap-1">
                      <Badge className="text-[10px] border-0 w-fit bg-muted text-muted-foreground">{l.targetType || "—"}</Badge>
                      {l.targetId && <span className="text-[10px] text-muted-foreground break-all">{l.targetId}</span>}
                    </div>
                    <span className="text-[11px] font-mono text-muted-foreground">{l.ipAddress || "—"}</span>
                    {l.detail && (
                      <div className="col-span-6 text-[11px] text-muted-foreground border-t border-border/60 pt-1">
                        {l.detail}
                      </div>
                    )}
                  </div>
                ))}
                {filtered.length === 0 && (
                  <div className="px-4 py-8 text-center text-xs text-muted-foreground">Sin resultados.</div>
                )}
              </div>
              <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-border">
                <Button type="button" variant="outline" size="sm" disabled={page <= 0} onClick={() => void load(page - 1)}>
                  Anterior
                </Button>
                <p className="text-[11px] text-muted-foreground">
                  Página {page + 1}
                  {totalPages ? ` / ${totalPages}` : ""}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={totalPages > 0 ? page + 1 >= totalPages : rows.length === 0}
                  onClick={() => void load(page + 1)}
                >
                  Siguiente
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
