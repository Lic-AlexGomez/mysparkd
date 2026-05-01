"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatCard } from "./shared"
import { Bell, CheckCircle, Loader2, Send, Smartphone, XCircle } from "lucide-react"
import { adminService, type AdminNotificationStats } from "@/lib/services/admin"
import { toast } from "sonner"

export function AdminNotifications() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<AdminNotificationStats | null>(null)

  useEffect(() => {
    adminService
      .getNotifications()
      .then(setData)
      .catch((error: unknown) => {
        const msg = error instanceof Error ? error.message : "No se pudieron cargar notificaciones"
        toast.error(msg)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!data) {
    return (
      <Card className="border-border">
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Sin datos de notificaciones push.
        </CardContent>
      </Card>
    )
  }

  const withoutPush = Math.max(data.totalUsers - data.usersWithPushEnabled, 0)
  const stats = [
    { label: "Device tokens", value: data.totalDeviceTokens.toLocaleString(), icon: Send, color: "bg-primary" },
    { label: "Cobertura push", value: `${data.pushCoveragePct.toFixed(2)}%`, icon: Bell, color: "bg-amber-500" },
    { label: "Usuarios con push", value: data.usersWithPushEnabled.toLocaleString(), icon: CheckCircle, color: "bg-emerald-500" },
    { label: "Usuarios sin push", value: withoutPush.toLocaleString(), icon: XCircle, color: "bg-rose-500" },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s) => (
          <StatCard key={s.label} label={s.label} value={s.value} icon={s.icon} color={s.color} />
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Send className="h-4 w-4 text-primary" /> Cobertura de push
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-2xl font-black">{data.pushCoveragePct.toFixed(2)}%</p>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(data.pushCoveragePct, 100)}%` }} />
            </div>
            <p className="text-xs text-muted-foreground">
              {data.usersWithPushEnabled.toLocaleString()} usuarios con push activo de{" "}
              {data.totalUsers.toLocaleString()} totales
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-secondary" /> Tokens FCM
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tokens registrados</span>
              <span className="font-semibold text-foreground">{data.totalDeviceTokens.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Usuarios con al menos 1 token</span>
              <span className="font-semibold text-emerald-500">{data.usersWithPushEnabled.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Usuarios sin token</span>
              <span className="font-semibold text-rose-500">{withoutPush.toLocaleString()}</span>
            </div>
            <p className="text-[11px] text-muted-foreground pt-2 border-t border-border">
              Nota: un usuario puede tener varios dispositivos; por eso los tokens pueden superar el total de usuarios.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
