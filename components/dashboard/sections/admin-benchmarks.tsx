"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { StatCard } from "./shared"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { BarChart3, Loader2, Plus, Trash2 } from "lucide-react"
import { adminService, type BenchmarkRow } from "@/lib/services/admin"
import { toast } from "sonner"

type EditableBenchmark = {
  id: number
  metric: string
  value: string
  source: string
  notes: string
}

const toEditable = (row: BenchmarkRow): EditableBenchmark => ({
  id: row.id,
  metric: String(row.metric ?? ""),
  value: String(row.value ?? ""),
  source: String(row.source ?? ""),
  notes: String(row.notes ?? ""),
})

export function AdminBenchmarks() {
  const [rows, setRows] = useState<EditableBenchmark[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<number | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [draft, setDraft] = useState({ metric: "", value: "", source: "", notes: "" })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const list = await adminService.getBenchmarks()
      setRows((Array.isArray(list) ? list : []).map(toEditable))
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "No se pudieron cargar benchmarks"
      toast.error(msg)
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const summary = useMemo(() => ({ total: rows.length }), [rows])

  const saveRow = async (row: EditableBenchmark) => {
    setSavingId(row.id)
    try {
      await adminService.updateBenchmark(row.id, {
        metric: row.metric,
        value: row.value,
        source: row.source,
        notes: row.notes,
      })
      toast.success("Benchmark guardado")
      await load()
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "No se pudo guardar"
      toast.error(msg)
    } finally {
      setSavingId(null)
    }
  }

  const deleteRow = async (id: number) => {
    if (!window.confirm("¿Eliminar este benchmark?")) return
    setSavingId(id)
    try {
      await adminService.deleteBenchmark(id)
      toast.success("Eliminado")
      await load()
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "No se pudo eliminar"
      toast.error(msg)
    } finally {
      setSavingId(null)
    }
  }

  const createRow = async () => {
    const metric = draft.metric.trim()
    if (!metric) {
      toast.error("La métrica es obligatoria")
      return
    }
    try {
      await adminService.createBenchmark({
        metric,
        value: draft.value.trim(),
        source: draft.source.trim(),
        notes: draft.notes.trim(),
      })
      toast.success("Benchmark creado")
      setCreateOpen(false)
      setDraft({ metric: "", value: "", source: "", notes: "" })
      await load()
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "No se pudo crear"
      toast.error(msg)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Entradas" value={String(summary.total)} icon={BarChart3} color="bg-primary" />
        <StatCard label="Fuente" value="Manual" icon={BarChart3} color="bg-secondary" />
        <StatCard label="Persistencia" value="Memoria (BE)" icon={BarChart3} color="bg-amber-500" />
        <StatCard label="Estado" value={savingId ? "Guardando…" : "Listo"} icon={BarChart3} color="bg-emerald-500" />
      </div>

      <div className="flex justify-end">
        <Button type="button" size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          Agregar
        </Button>
      </div>

      <Card className="border-border overflow-x-auto">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" /> Benchmarks (API)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 min-w-[720px]">
          <div className="grid grid-cols-12 gap-2 px-4 py-2 border-b border-border text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
            <span className="col-span-3">Métrica</span>
            <span className="col-span-2">Valor</span>
            <span className="col-span-3">Fuente</span>
            <span className="col-span-3">Notas</span>
            <span className="col-span-1 text-right">Acciones</span>
          </div>
          <div className="divide-y divide-border">
            {rows.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-muted-foreground">Sin benchmarks.</div>
            ) : (
              rows.map((row) => (
                <div key={row.id} className="grid grid-cols-12 gap-2 px-4 py-3 items-start text-xs">
                  <Input
                    className="col-span-3 h-8 text-xs"
                    value={row.metric}
                    disabled={savingId === row.id}
                    onChange={(e) =>
                      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, metric: e.target.value } : r)))
                    }
                  />
                  <Input
                    className="col-span-2 h-8 text-xs"
                    value={row.value}
                    disabled={savingId === row.id}
                    onChange={(e) =>
                      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, value: e.target.value } : r)))
                    }
                  />
                  <Input
                    className="col-span-3 h-8 text-xs"
                    value={row.source}
                    disabled={savingId === row.id}
                    onChange={(e) =>
                      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, source: e.target.value } : r)))
                    }
                  />
                  <Input
                    className="col-span-3 h-8 text-xs"
                    value={row.notes}
                    disabled={savingId === row.id}
                    onChange={(e) =>
                      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, notes: e.target.value } : r)))
                    }
                  />
                  <div className="col-span-1 flex flex-col gap-1 items-end">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="h-8 px-2 text-[11px]"
                      disabled={savingId === row.id}
                      onClick={() => void saveRow(row)}
                    >
                      Guardar
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-rose-500"
                      disabled={savingId === row.id}
                      onClick={() => void deleteRow(row.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo benchmark</DialogTitle>
            <DialogDescription>Datos manuales para comparativas internas.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="bm-metric">Métrica</Label>
              <Input
                id="bm-metric"
                className="mt-1"
                value={draft.metric}
                onChange={(e) => setDraft((p) => ({ ...p, metric: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="bm-value">Valor</Label>
              <Input
                id="bm-value"
                className="mt-1"
                value={draft.value}
                onChange={(e) => setDraft((p) => ({ ...p, value: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="bm-source">Fuente</Label>
              <Input
                id="bm-source"
                className="mt-1"
                value={draft.source}
                onChange={(e) => setDraft((p) => ({ ...p, source: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="bm-notes">Notas</Label>
              <Input
                id="bm-notes"
                className="mt-1"
                value={draft.notes}
                onChange={(e) => setDraft((p) => ({ ...p, notes: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={() => void createRow()}>
              Crear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
