"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { StatCard } from "./shared"
import { Users, UserPlus, Crown, UserX, Search, Loader2, Shield } from "lucide-react"
import { api } from "@/lib/api"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface AdminUser {
  userId: string
  username: string
  email: string
  enabled: boolean
  locked: boolean
  premium: boolean
  fechaRegistro: string
  postCount: number
  nombres?: string
  apellidos?: string
  profilePictureUrl?: string
}

export function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [search, setSearch] = useState("")

  const fetchUsers = async () => {
    try {
      const data = await api.get<AdminUser[]>('/api/admin/users')
      setUsers(data)
    } catch {
      // endpoint pendiente
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [])

  const handleToggle = async (user: AdminUser) => {
    setActionLoading(user.userId)
    try {
      const action = user.enabled ? 'disable' : 'enable'
      await api.post(`/api/admin/users/${user.userId}/${action}`)
      toast.success(user.enabled ? 'Usuario deshabilitado' : 'Usuario habilitado')
      setUsers(prev => prev.map(u =>
        u.userId === user.userId ? { ...u, enabled: !u.enabled } : u
      ))
    } catch {
      toast.error('Error al actualizar usuario')
    } finally {
      setActionLoading(null)
    }
  }

  const handleAssignRole = async (userId: string, roleName: string) => {
    setActionLoading(userId)
    try {
      await api.post('/api/administrator/user-roles/assign', { userId, roleName })
      toast.success(`Rol ${roleName} asignado correctamente`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al asignar rol')
    } finally {
      setActionLoading(null)
    }
  }

  const filtered = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  const STATS = [
    { label: "Total usuarios",  value: String(users.length),                              change: 0, icon: Users,    color: "bg-violet-500" },
    { label: "Premium",         value: String(users.filter(u => u.premium).length),       change: 0, icon: Crown,    color: "bg-amber-500" },
    { label: "Deshabilitados",  value: String(users.filter(u => !u.enabled).length),      change: 0, icon: UserX,    color: "bg-rose-500" },
    { label: "Nuevos (visible)", value: String(users.slice(0, 10).length) + "+",          change: 0, icon: UserPlus, color: "bg-emerald-500" },
  ]

  const getTimeAgo = (dateStr: string) => {
    if (!dateStr) return "—"
    const diff = Date.now() - new Date(dateStr).getTime()
    const days = Math.floor(diff / 86400000)
    if (days === 0) return "hoy"
    if (days === 1) return "ayer"
    if (days < 7) return `hace ${days}d`
    if (days < 30) return `hace ${Math.floor(days / 7)}sem`
    return `hace ${Math.floor(days / 30)}m`
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {STATS.map(s => <StatCard key={s.label} {...s} />)}
      </div>

      <Card className="border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <CardTitle className="text-sm">
              Usuarios {!loading && `(${filtered.length})`}
            </CardTitle>
            <div className="relative w-48">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar..."
                className="pl-8 h-8 text-xs bg-muted border-border"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : users.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">
              Endpoint pendiente de implementación en el backend
            </p>
          ) : (
            <>
              <div className="grid grid-cols-7 gap-2 px-4 py-2 border-b border-border text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                <span className="col-span-2">Usuario</span>
                <span>Estado</span>
                <span>Posts</span>
                <span>Registro</span>
                <span>Rol</span>
                <span>Acción</span>
              </div>
              <div className="divide-y divide-border">
                {filtered.map(u => (
                  <div key={u.userId} className="grid grid-cols-7 gap-2 px-4 py-3 items-center hover:bg-muted/20 transition-colors">
                    <div className="col-span-2 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center shrink-0 overflow-hidden">
                          {u.profilePictureUrl
                            ? <img src={u.profilePictureUrl} className="h-full w-full object-cover" />
                            : <span className="text-[10px] font-bold text-foreground">{u.username[0].toUpperCase()}</span>
                          }
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate flex items-center gap-1">
                            @{u.username}
                            {u.premium && <Crown className="h-3 w-3 text-amber-500 shrink-0" />}
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate">{u.email}</p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <Badge className={`text-[10px] border-0 ${
                        !u.enabled   ? "bg-rose-500/15 text-rose-500" :
                        u.locked     ? "bg-orange-500/15 text-orange-500" :
                        "bg-emerald-500/15 text-emerald-500"
                      }`}>
                        {!u.enabled ? "deshabilitado" : u.locked ? "bloqueado" : "activo"}
                      </Badge>
                    </div>
                    <span className="text-xs text-foreground font-medium">{u.postCount}</span>
                    <span className="text-xs text-muted-foreground">{getTimeAgo(u.fechaRegistro)}</span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1"
                          disabled={actionLoading === u.userId}
                        >
                          <Shield className="h-3 w-3" />
                          Rol
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-card border-border">
                        <DropdownMenuItem
                          onClick={() => handleAssignRole(u.userId, 'ROLE_ADMIN')}
                          className="cursor-pointer text-xs"
                        >
                          <Crown className="h-3.5 w-3.5 mr-2 text-amber-500" />
                          Asignar Admin
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleAssignRole(u.userId, 'ROLE_MODERATOR')}
                          className="cursor-pointer text-xs"
                        >
                          <Shield className="h-3.5 w-3.5 mr-2 text-blue-500" />
                          Asignar Moderador
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleAssignRole(u.userId, 'ROLE_USER')}
                          className="cursor-pointer text-xs"
                        >
                          <Users className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                          Quitar rol especial
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button
                      size="sm"
                      variant={u.enabled ? "destructive" : "outline"}
                      className="h-7 text-xs"
                      disabled={actionLoading === u.userId}
                      onClick={() => handleToggle(u)}
                    >
                      {actionLoading === u.userId
                        ? <Loader2 className="h-3 w-3 animate-spin" />
                        : u.enabled ? "Deshabilitar" : "Habilitar"
                      }
                    </Button>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
