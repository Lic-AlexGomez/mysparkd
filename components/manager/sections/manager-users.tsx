"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Users, Search, Crown, Ban, AlertTriangle, Eye, UserCheck } from "lucide-react"

const USERS = [
  { id: "u1", username: "sofia_m",   name: "Sofía Martínez",  joined: "hace 2h",   premium: true,  status: "activo",   reports: 0, posts: 12, matches: 34, lastSeen: "ahora" },
  { id: "u2", username: "carlos_r",  name: "Carlos Ruiz",     joined: "hace 5h",   premium: false, status: "activo",   reports: 0, posts: 3,  matches: 8,  lastSeen: "hace 10 min" },
  { id: "u3", username: "ana_lopez", name: "Ana López",       joined: "hace 1d",   premium: true,  status: "activo",   reports: 1, posts: 28, matches: 67, lastSeen: "hace 1h" },
  { id: "u4", username: "miguel_v",  name: "Miguel Vargas",   joined: "hace 2d",   premium: false, status: "advertido",reports: 2, posts: 1,  matches: 2,  lastSeen: "hace 2d" },
  { id: "u5", username: "lucia_p",   name: "Lucía Pérez",     joined: "hace 3d",   premium: false, status: "activo",   reports: 0, posts: 7,  matches: 15, lastSeen: "hace 30 min" },
  { id: "u6", username: "pedro_g",   name: "Pedro García",    joined: "hace 5d",   premium: true,  status: "activo",   reports: 0, posts: 45, matches: 89, lastSeen: "hace 2h" },
  { id: "u7", username: "maria_t",   name: "María Torres",    joined: "hace 1sem", premium: false, status: "baneado",  reports: 5, posts: 0,  matches: 0,  lastSeen: "hace 1sem" },
  { id: "u8", username: "jose_r",    name: "José Rodríguez",  joined: "hace 2sem", premium: true,  status: "activo",   reports: 0, posts: 67, matches: 123,lastSeen: "hace 5 min" },
  { id: "u9", username: "user_x91",  name: "Usuario X91",     joined: "hace 3sem", premium: false, status: "advertido",reports: 3, posts: 2,  matches: 1,  lastSeen: "hace 3d" },
]

const STATUS_COLORS: Record<string, string> = {
  activo:    "bg-emerald-500/15 text-emerald-500",
  advertido: "bg-amber-500/15 text-amber-500",
  baneado:   "bg-rose-500/15 text-rose-500",
}

export function ManagerUsers() {
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("todos")
  const [selected, setSelected] = useState<string | null>(null)

  const filtered = USERS.filter(u => {
    const matchSearch = u.username.includes(search.toLowerCase()) || u.name.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === "todos" || u.status === filter || (filter === "reportados" && u.reports > 0)
    return matchSearch && matchFilter
  })

  const selectedUser = USERS.find(u => u.id === selected)

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex items-center gap-2 flex-wrap">
        {["todos", "activo", "advertido", "baneado", "reportados"].map(f => (
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
              <span className="col-span-2">Usuario</span><span>Estado</span><span>Reportes</span><span>Acciones</span>
            </div>
            <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
              {filtered.map(u => (
                <div
                  key={u.id}
                  onClick={() => setSelected(u.id === selected ? null : u.id)}
                  className={`grid grid-cols-5 gap-2 px-4 py-3 items-center cursor-pointer transition-colors ${selected === u.id ? "bg-secondary/5 border-l-2 border-secondary" : "hover:bg-muted/20"}`}
                >
                  <div className="col-span-2 flex items-center gap-2 min-w-0">
                    <div className="h-7 w-7 rounded-full bg-gradient-to-br from-secondary/30 to-accent/30 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold">{u.username[0].toUpperCase()}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate flex items-center gap-1">
                        @{u.username} {u.premium && <Crown className="h-3 w-3 text-amber-500 shrink-0" />}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{u.lastSeen}</p>
                    </div>
                  </div>
                  <Badge className={`text-[10px] border-0 w-fit ${STATUS_COLORS[u.status]}`}>{u.status}</Badge>
                  <span className={`text-xs font-bold ${u.reports > 0 ? "text-rose-500" : "text-muted-foreground"}`}>
                    {u.reports > 0 ? `⚠ ${u.reports}` : "—"}
                  </span>
                  <div className="flex gap-1">
                    <button className="h-6 w-6 rounded-lg bg-muted flex items-center justify-center hover:bg-primary/20 transition-colors" title="Ver perfil">
                      <Eye className="h-3 w-3 text-muted-foreground" />
                    </button>
                    {u.status !== "baneado" && (
                      <button className="h-6 w-6 rounded-lg bg-muted flex items-center justify-center hover:bg-rose-500/20 transition-colors" title="Banear">
                        <Ban className="h-3 w-3 text-muted-foreground" />
                      </button>
                    )}
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
                    <p className="text-sm font-bold text-foreground">{selectedUser.name}</p>
                    <p className="text-xs text-muted-foreground">@{selectedUser.username}</p>
                    <Badge className={`text-[10px] border-0 mt-1 ${STATUS_COLORS[selectedUser.status]}`}>{selectedUser.status}</Badge>
                  </div>
                </div>
                <div className="space-y-1.5 text-xs border-t border-border pt-3">
                  {[
                    ["Registrado",  selectedUser.joined],
                    ["Último acceso", selectedUser.lastSeen],
                    ["Posts",       selectedUser.posts],
                    ["Matches",     selectedUser.matches],
                    ["Reportes",    selectedUser.reports],
                    ["Premium",     selectedUser.premium ? "Sí" : "No"],
                  ].map(([k, v]) => (
                    <div key={k as string} className="flex justify-between">
                      <span className="text-muted-foreground">{k}</span>
                      <span className={`font-semibold ${k === "Reportes" && Number(v) > 0 ? "text-rose-500" : "text-foreground"}`}>{v}</span>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-2 pt-2 border-t border-border">
                  <Button size="sm" variant="outline" className="w-full text-xs h-8">
                    <Eye className="h-3.5 w-3.5 mr-1.5" /> Ver perfil completo
                  </Button>
                  {selectedUser.status !== "baneado" && (
                    <>
                      <Button size="sm" variant="outline" className="w-full text-xs h-8 border-amber-500/30 text-amber-500 hover:bg-amber-500/10">
                        <AlertTriangle className="h-3.5 w-3.5 mr-1.5" /> Enviar advertencia
                      </Button>
                      <Button size="sm" variant="outline" className="w-full text-xs h-8 border-rose-500/30 text-rose-500 hover:bg-rose-500/10">
                        <Ban className="h-3.5 w-3.5 mr-1.5" /> Banear usuario
                      </Button>
                    </>
                  )}
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
    </div>
  )
}
