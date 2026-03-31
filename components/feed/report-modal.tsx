"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { reportService, type ReportTargetType, type ReportReason } from "@/lib/services/report"
import { toast } from "sonner"
import { Flag, Loader2 } from "lucide-react"

interface ReportModalProps {
  open: boolean
  onClose: () => void
  reportedUserId: string
  targetId: string
  targetType: ReportTargetType
}

export function ReportModal({ open, onClose, reportedUserId, targetId, targetType }: ReportModalProps) {
  const [reasons, setReasons] = useState<ReportReason[]>([])
  const [selectedReason, setSelectedReason] = useState<string | null>(null)
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const [loadingReasons, setLoadingReasons] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoadingReasons(true)
    reportService.getReasons().then(r => {
      setReasons(r)
      setLoadingReasons(false)
    })
  }, [open])

  const handleSubmit = async () => {
    if (!selectedReason) return
    setLoading(true)
    try {
      await reportService.createReport({
        reportedUserId,
        targetId,
        targetType,
        reasonId: selectedReason,
        description: description.trim() || undefined,
      })
      toast.success("Reporte enviado")
      onClose()
      setSelectedReason(null)
      setDescription("")
    } catch (e: any) {
      toast.error(e?.message || "Error al enviar reporte")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm bg-card border-border">
        <DialogTitle className="flex items-center gap-2 text-base">
          <Flag className="h-4 w-4 text-destructive" /> Reportar
        </DialogTitle>

        {loadingReasons ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">¿Por qué quieres reportar esto?</p>
            <div className="space-y-1.5">
              {reasons.map(r => (
                <button
                  key={r.id}
                  onClick={() => setSelectedReason(r.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors border ${
                    selectedReason === r.id
                      ? "border-destructive bg-destructive/10 text-foreground"
                      : "border-border hover:bg-muted text-foreground"
                  }`}
                >
                  {r.name}
                </button>
              ))}
            </div>

            <textarea
              placeholder="Descripción adicional (opcional)"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full text-sm bg-muted border border-border rounded-lg p-2.5 resize-none text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
              rows={2}
              maxLength={300}
            />

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={onClose} disabled={loading}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleSubmit}
                disabled={!selectedReason || loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar reporte"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
