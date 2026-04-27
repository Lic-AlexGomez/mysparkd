"use client"

import { useCallback, useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { StatCard } from "./shared"
import { Users, Crown, UserX, Search, Loader2, Shield, AlertCircle, RefreshCw, Lock } from "lucide-react"
import { api } from "@/lib/api"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ADMIN_USERS_LIST_GET,
  apiErrorStatus,
  extractArray,
  formatAdminUsersLoadError,
} from "@/lib/admin-api-helpers"

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

function pickStr(o: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = o[k]
    if (v != null && v !== "") return String(v)
  }
  return ""
}

function pickBool(o: Record<string, unknown>, key: string, def: boolean): boolean {
  const v = o[key]
  if (typeof v === "boolean") return v
  return def
}

function normalizeAdminUser(row: unknown): AdminUser | null {
  if (row == null || typeof row !== "object") return null
  const o = row as Record<string, unknown>
  const id = o.userId ?? o.id ?? o.user_id
  if (id == null || id === "") return null
  const reg =
    pickStr(o, "fechaRegistro", "createdAt", "created_at", "registeredAt", "joinDate") ||
    new Date().toISOString()
  const posts = o.postCount ?? o.postsCount ?? o.post_count ?? 0
  return {
    userId: String(id),
    username: pickStr(o, "username", "name", "handle") || "—",
    email: pickStr(o, "email", "correo") || "—",
    enabled: !pickBool(o, "disabled", false) && pickBool(o, "enabled", true),
    locked: pickBool(o, "locked", false) || pickBool(o, "accountLocked", false),
    premium:
      pickBool(o, "premium", false) ||
      String(o.accountType ?? o.account_type ?? "").toUpperCase() === "PREMIUM",
    fechaRegistro: reg,
    postCount: typeof posts === "number" ? posts : Number(posts) || 0,
    nombres: pickStr(o, "nombres", "firstName", "first_name") || undefined,
    apellidos: pickStr(o, "apellidos", "lastName", "last_name") || undefined,
    profilePictureUrl: pickStr(o, "profilePictureUrl", "profile_picture_url", "avatarUrl") || undefined,
  }
}

export function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [loadError, setLoadError] = useState<string | null>(null)
  const [httpStatus, setHttpStatus] = useState<number | undefined>(undefined)
  const [usedEndpoint, setUsedEndpoint] = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    setHttpStatus(undefined)
    setUsedEndpoint(null)

    try {
      const raw = await api.get<unknown>(ADMIN_USERS_LIST_GET)
      const rows = extractArray<unknown>(raw)
      const parsed = rows.map(normalizeAdminUser).filter((u): u is AdminUser => u !== null)
      setUsers(parsed)
      setUsedEndpoint(ADMIN_USERS_LIST_GET)
    } catch (e) {
      setUsers([])
      setHttpStatus(apiErrorStatus(e))
      setLoadError(formatAdminUsersLoadError(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchUsers()
  }, [fetchUsers])

  const handleToggle = async (user: AdminUser) => {
    setActionLoading(user.userId)
    try {
      const action = user.enabled ? "disable" : "enable"
      await api.post(`/api/admin/users/${user.userId}/${action}`)
      toast.success(user.enabled ? "Usuario deshabilitado" : "Usuario habilitado")
      setUsers((prev) =>
        prev.map((u) => (u.userId === user.userId ? { ...u, enabled: !u.enabled } : u))
      )
    } catch {
      toast.error("Error al actualizar usuario")
    } finally {
      setActionLoading(null)
    }
  }

  const handleAssignRole = async (userId: string, roleName: string) => {
    setActionLoading(userId)
    try {
      await api.post("/api/administrator/user-roles/assign", { userId, roleName })
      toast.success(`Rol ${roleName} asignado correctamente`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al asignar rol")
    } finally {
      setActionLoading(null)
    }
  }

  const filtered = users.filter((u) => {
    const q = search.toLowerCase()
    return (
      (u.username && u.username.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q))
    )
  })

  const errorHint =
    httpStatus === 403
      ? "Tu token no incluye permisos de administrador para este listado, o el backend deniega el recurso."
      : httpStatus === 401
        ? "Sesión inválida o expirada."
        : null

  const statValue = (n: number) => (loadError ? "—" : String(n))

  const STATS = [
    { label: "Total", value: statValue(users.length), change: 0, icon: Users, color: "bg-violet-500" },
    { label: "Premium", value: statValue(users.filter((u) => u.premium).length), change: 0, icon: Crown, color: "bg-amber-500" },
    { label: "Deshabilitados", value: statValue(users.filter((u) => !u.enabled).length), change: 0, icon: UserX, color: "bg-rose-500" },
    { label: "Bloqueados", value: statValue(users.filter((u) => u.locked).length), change: 0, icon: Lock, color: "bg-orange-500" },
  ]

  const getTimeAgo = (dateStr: string) => {
    if (!dateStr) return "—"
    const t = new Date(dateStr).getTime()
    if (Number.isNaN(t)) return "—"
    const diff = Date.now() - t
    const days = Math.floor(diff / 86400000)
    if (days === 0) return "hoy"
    if (days === 1) return "ayer"
    if (days < 7) return `hace ${days}d`
    if (days < 30) return `hace ${Math.floor(days / 7)}sem`
    return `hace ${Math.floor(days / 30)}m`
  }

  return (
    <div className="space-y-6">
      {loadError && (
        <Alert variant="destructive" className="border-rose-500/40 bg-rose-500/5">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="text-sm">No se pudo sincronizar la lista</AlertTitle>
          <AlertDescription className="text-xs space-y-2">
            <p>{loadError}</p>
            {httpStatus != null && <p className="font-mono text-[10px] opacity-90">HTTP {httpStatus}</p>}
            {errorHint && <p className="text-muted-foreground">{errorHint}</p>}
            <Button type="button" size="sm" variant="outline" className="mt-1 h-8 text-xs" onClick={() => void fetchUsers()}>
              <RefreshCw className="h-3 w-3 mr-1.5" />
              Reintentar
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {!loadError && usedEndpoint && (
        <p className="text-[10px] text-muted-foreground font-mono">
          Fuente: <span className="text-foreground/80">{usedEndpoint}</span>
          {users.length === 0 && !loading && " · Respuesta vacía (0 filas). Los KPI quedan en 0."}
        </p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {STATS.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      <Card className="border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <CardTitle className="text-sm">
              Usuarios {!loading && !loadError && `(${filtered.length})`}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-8 text-xs"
                onClick={() => void fetchUsers()}
                disabled={loading}
              >
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                <span className="ml-1 hidden sm:inline">Actualizar</span>
              </Button>
              <div className="relative w-48">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar..."
                  className="pl-8 h-8 text-xs bg-muted border-border"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : loadError ? (
            <p className="text-sm text-muted-foreground text-center py-10 px-4">
              Corrige el error arriba o reintenta. Mientras falle la petición, la tabla no muestra filas.
            </p>
          ) : users.length === 0 ? (
            <div className="text-center py-10 px-4 space-y-2">
              <p className="text-sm text-muted-foreground">El backend devolvió 0 usuarios.</p>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Si esperabas datos, confirma en el API que el endpoint de listado exista, que requiera rol
                adecuado y que el cuerpo sea un array o un JSON paginado (p. ej. <code className="text-[10px]">content</code>
                ).
              </p>
            </div>
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
                {filtered.map((u) => (
                  <div
                    key={u.userId}
                    className="grid grid-cols-7 gap-2 px-4 py-3 items-center hover:bg-muted/20 transition-colors"
                  >
                    <div className="col-span-2 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center shrink-0 overflow-hidden">
                          {u.profilePictureUrl ? (
                            <img src={u.profilePictureUrl} className="h-full w-full object-cover" alt="" />
                          ) : (
                            <span className="text-[10px] font-bold text-foreground">
                              {(u.username[0] || "?").toUpperCase()}
                            </span>
                          )}
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
                      <Badge
                        className={`text-[10px] border-0 ${
                          !u.enabled
                            ? "bg-rose-500/15 text-rose-500"
                            : u.locked
                              ? "bg-orange-500/15 text-orange-500"
                              : "bg-emerald-500/15 text-emerald-500"
                        }`}
                      >
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
                          onClick={() => handleAssignRole(u.userId, "ROLE_ADMIN")}
                          className="cursor-pointer text-xs"
                        >
                          <Crown className="h-3.5 w-3.5 mr-2 text-amber-500" />
                          Asignar Admin
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleAssignRole(u.userId, "ROLE_MODERATOR")}
                          className="cursor-pointer text-xs"
                        >
                          <Shield className="h-3.5 w-3.5 mr-2 text-blue-500" />
                          Asignar Moderador
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleAssignRole(u.userId, "ROLE_USER")}
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
                      {actionLoading === u.userId ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : u.enabled ? (
                        "Deshabilitar"
                      ) : (
                        "Habilitar"
                      )}
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
