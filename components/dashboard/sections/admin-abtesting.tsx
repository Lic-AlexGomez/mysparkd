"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { StatCard } from "./shared"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FlaskConical, Loader2, Plus, Trash2 } from "lucide-react"
import { adminService, type FeatureFlagInput, type FeatureFlagRow } from "@/lib/services/admin"
import { toast } from "sonner"

export function AdminABTesting() {
  const [rows, setRows] = useState<FeatureFlagRow[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState<FeatureFlagInput>({
    name: "",
    description: "",
    enabled: false,
    rolloutPercent: 0,
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const list = await adminService.getFeatureFlags()
      setRows(Array.isArray(list) ? list : [])
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "No se pudieron cargar feature flags"
      toast.error(msg)
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const summary = useMemo(() => {
    const total = rows.length
    const enabled = rows.filter((r) => r.enabled).length
    const rolloutAvg =
      total > 0 ? Math.round(rows.reduce((s, r) => s + (r.rolloutPercent || 0), 0) / total) : 0
    return { total, enabled, rolloutAvg }
  }, [rows])

  const persist = async (id: string, body: FeatureFlagInput) => {
    setSavingId(id)
    try {
      await adminService.updateFeatureFlag(id, body)
      toast.success("Flag actualizado")
      await load()
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "No se pudo guardar"
      toast.error(msg)
    } finally {
      setSavingId(null)
    }
  }

  const handleToggle = async (row: FeatureFlagRow, enabled: boolean) => {
    await persist(row.id, {
      name: row.name,
      description: row.description || "",
      enabled,
      rolloutPercent: row.rolloutPercent ?? 0,
    })
  }

  const handleRolloutChange = async (row: FeatureFlagRow, value: string) => {
    const n = Number(value)
    if (Number.isNaN(n) || n < 0 || n > 100) return
    await persist(row.id, {
      name: row.name,
      description: row.description || "",
      enabled: row.enabled,
      rolloutPercent: Math.floor(n),
    })
  }

  const handleDelete = async (row: FeatureFlagRow) => {
    if (!window.confirm(`¿Eliminar el flag "${row.name}"?`)) return
    setSavingId(row.id)
    try {
      await adminService.deleteFeatureFlag(row.id)
      toast.success("Flag eliminado")
      await load()
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "No se pudo eliminar"
      toast.error(msg)
    } finally {
      setSavingId(null)
    }
  }

  const handleCreate = async () => {
    const name = createForm.name.trim()
    if (!name) {
      toast.error("El nombre es obligatorio")
      return
    }
    try {
      await adminService.createFeatureFlag({
        name,
        description: (createForm.description ?? "").trim(),
        enabled: createForm.enabled,
        rolloutPercent: Math.min(100, Math.max(0, Math.floor(createForm.rolloutPercent || 0))),
      })
      toast.success("Flag creado")
      setCreateOpen(false)
      setCreateForm({ name: "", description: "", enabled: false, rolloutPercent: 0 })
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
        <StatCard label="Flags totales" value={String(summary.total)} icon={FlaskConical} color="bg-primary" />
        <StatCard label="Activos" value={String(summary.enabled)} icon={FlaskConical} color="bg-emerald-500" />
        <StatCard label="Rollout medio" value={`${summary.rolloutAvg}%`} icon={FlaskConical} color="bg-secondary" />
        <StatCard label="En edición" value={savingId ? "Sí" : "No"} icon={FlaskConical} color="bg-amber-500" />
      </div>

      <div className="flex justify-end">
        <Button type="button" size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          Nuevo flag
        </Button>
      </div>

      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Feature flags (API)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-12 gap-2 px-4 py-2 border-b border-border text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
            <span className="col-span-3">Nombre</span>
            <span className="col-span-4">Descripción</span>
            <span className="col-span-2">Activo</span>
            <span className="col-span-2">Rollout %</span>
            <span className="col-span-1 text-right">Acciones</span>
          </div>
          <div className="divide-y divide-border">
            {rows.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-muted-foreground">No hay flags todavía.</div>
            ) : (
              rows.map((row) => (
                <div key={row.id} className="grid grid-cols-12 gap-2 px-4 py-3 items-center text-xs">
                  <div className="col-span-3 font-semibold text-foreground truncate">{row.name}</div>
                  <div className="col-span-4 text-muted-foreground line-clamp-2">{row.description || "—"}</div>
                  <div className="col-span-2 flex items-center gap-2">
                    <Switch
                      checked={Boolean(row.enabled)}
                      disabled={savingId === row.id}
                      onCheckedChange={(v) => void handleToggle(row, v)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      className="h-8 text-xs"
                      value={row.rolloutPercent}
                      disabled={savingId === row.id}
                      onChange={(e) => void handleRolloutChange(row, e.target.value)}
                    />
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-rose-500"
                      disabled={savingId === row.id}
                      onClick={() => void handleDelete(row)}
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
            <DialogTitle>Nuevo feature flag</DialogTitle>
            <DialogDescription>Crea un flag con rollout gradual (0–100%).</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="ff-name">Nombre</Label>
              <Input
                id="ff-name"
                className="mt-1"
                value={createForm.name}
                onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="ej: premium_likes_blur"
              />
            </div>
            <div>
              <Label htmlFor="ff-desc">Descripción</Label>
              <Input
                id="ff-desc"
                className="mt-1"
                value={createForm.description}
                onChange={(e) => setCreateForm((p) => ({ ...p, description: e.target.value }))}
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <Label>Activado</Label>
              <Switch
                checked={createForm.enabled}
                onCheckedChange={(v) => setCreateForm((p) => ({ ...p, enabled: v }))}
              />
            </div>
            <div>
              <Label htmlFor="ff-roll">Rollout %</Label>
              <Input
                id="ff-roll"
                type="number"
                min={0}
                max={100}
                className="mt-1"
                value={createForm.rolloutPercent}
                onChange={(e) =>
                  setCreateForm((p) => ({ ...p, rolloutPercent: Number(e.target.value) }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={() => void handleCreate()}>
              Crear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
