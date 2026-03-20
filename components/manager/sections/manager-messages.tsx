"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { MessageCircle, Search, Eye, Flag, Trash2, AlertTriangle } from "lucide-react"

const CHATS = [
  { id: "c1", user1: "sofia_m",   user2: "jose_r",    messages: 142, lastMsg: "¿Cuándo nos vemos?",          lastDate: "hace 5 min",  reported: false, flagged: false },
  { id: "c2", user1: "user_x91",  user2: "lucia_p",   messages: 23,  lastMsg: "Mensaje reportado...",         lastDate: "hace 20 min", reported: true,  flagged: true  },
  { id: "c3", user1: "pedro_g",   user2: "ana_lopez",  messages: 89,  lastMsg: "Gracias por el consejo 😊",   lastDate: "hace 1h",     reported: false, flagged: false },
  { id: "c4", user1: "carlos_r",  user2: "maria_t",   messages: 7,   lastMsg: "Hola, ¿cómo estás?",          lastDate: "hace 2h",     reported: false, flagged: false },
  { id: "c5", user1: "user_k44",  user2: "user_b34",  messages: 34,  lastMsg: "Contenido inapropiado...",     lastDate: "hace 3h",     reported: true,  flagged: true  },
  { id: "c6", user1: "miguel_v",  user2: "sofia_m",   messages: 56,  lastMsg: "¡Qué buena foto!",             lastDate: "hace 4h",     reported: false, flagged: false },
]

const FLAGGED_MESSAGES = [
  { id: "m1", chat: "c2", sender: "user_x91",  content: "Si no me respondes voy a...",          reason: "Amenaza",    date: "hace 20 min" },
  { id: "m2", chat: "c5", sender: "user_k44",  content: "Mira este link: [URL sospechosa]",     reason: "Spam/Phishing", date: "hace 3h" },
  { id: "m3", chat: "c2", sender: "user_x91",  content: "Sé dónde vives...",                    reason: "Acoso",      date: "hace 25 min" },
]

export function ManagerMessages() {
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("todos")
  const [selected, setSelected] = useState<string | null>(null)

  const filtered = CHATS.filter(c => {
    const matchSearch = c.user1.includes(search) || c.user2.includes(search)
    const matchFilter = filter === "todos" || (filter === "reportados" && c.reported) || (filter === "normales" && !c.reported)
    return matchSearch && matchFilter
  })

  const selectedChat = CHATS.find(c => c.id === selected)

  return (
    <div className="space-y-4">
      {/* Stats rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Chats activos",    value: "4,821", color: "text-primary" },
          { label: "Mensajes hoy",     value: "18,492",color: "text-blue-500" },
          { label: "Chats reportados", value: "2",     color: "text-rose-500" },
          { label: "Msgs bloqueados",  value: "7",     color: "text-amber-500" },
        ].map(s => (
          <Card key={s.label} className="border-border">
            <CardContent className="p-4">
              <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Mensajes flaggeados */}
      {FLAGGED_MESSAGES.length > 0 && (
        <Card className="border-rose-500/30 bg-rose-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-rose-500">
              <AlertTriangle className="h-4 w-4" /> Mensajes flaggeados por IA
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {FLAGGED_MESSAGES.map(m => (
              <div key={m.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-background border border-rose-500/20">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-semibold text-foreground">@{m.sender}</span>
                    <Badge className="text-[10px] border-0 bg-rose-500/15 text-rose-500">{m.reason}</Badge>
                    <span className="text-[10px] text-muted-foreground ml-auto">{m.date}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">"{m.content}"</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center hover:bg-rose-500/20 transition-colors">
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        {["todos", "reportados", "normales"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors capitalize ${filter === f ? "bg-secondary text-white border-secondary" : "border-border text-muted-foreground hover:border-secondary"}`}>
            {f}
          </button>
        ))}
        <div className="relative ml-auto">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar usuario..." className="pl-8 h-8 text-xs bg-muted border-border w-48" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="border-border lg:col-span-2">
          <CardContent className="p-0">
            <div className="grid grid-cols-4 gap-2 px-4 py-2 border-b border-border text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
              <span className="col-span-2">Participantes</span><span>Mensajes</span><span>Estado</span>
            </div>
            <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
              {filtered.map(c => (
                <div
                  key={c.id}
                  onClick={() => setSelected(c.id === selected ? null : c.id)}
                  className={`grid grid-cols-4 gap-2 px-4 py-3 items-center cursor-pointer transition-colors ${selected === c.id ? "bg-secondary/5 border-l-2 border-secondary" : "hover:bg-muted/20"} ${c.reported ? "bg-rose-500/3" : ""}`}
                >
                  <div className="col-span-2 min-w-0">
                    <p className="text-xs font-semibold text-foreground">@{c.user1} ↔ @{c.user2}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{c.lastMsg}</p>
                    <p className="text-[10px] text-muted-foreground">{c.lastDate}</p>
                  </div>
                  <span className="text-xs text-foreground font-medium">{c.messages}</span>
                  <div className="flex items-center gap-1">
                    {c.reported
                      ? <Badge className="text-[10px] border-0 bg-rose-500/15 text-rose-500">reportado</Badge>
                      : <Badge className="text-[10px] border-0 bg-emerald-500/15 text-emerald-500">normal</Badge>
                    }
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-secondary" />
              {selectedChat ? "Detalle del chat" : "Selecciona un chat"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedChat ? (
              <div className="space-y-3">
                <div className={`p-3 rounded-xl border ${selectedChat.reported ? "border-rose-500/30 bg-rose-500/5" : "border-border bg-muted/20"}`}>
                  <p className="text-xs text-muted-foreground">Último mensaje:</p>
                  <p className="text-xs text-foreground mt-1">"{selectedChat.lastMsg}"</p>
                </div>
                <div className="space-y-1.5 text-xs">
                  {[
                    ["Usuario 1",   `@${selectedChat.user1}`],
                    ["Usuario 2",   `@${selectedChat.user2}`],
                    ["Mensajes",    selectedChat.messages],
                    ["Último msg",  selectedChat.lastDate],
                    ["Reportado",   selectedChat.reported ? "Sí" : "No"],
                  ].map(([k, v]) => (
                    <div key={k as string} className="flex justify-between">
                      <span className="text-muted-foreground">{k}</span>
                      <span className={`font-semibold ${k === "Reportado" && v === "Sí" ? "text-rose-500" : "text-foreground"}`}>{v}</span>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-2 pt-2 border-t border-border">
                  <Button size="sm" variant="outline" className="w-full text-xs h-8">
                    <Eye className="h-3.5 w-3.5 mr-1.5" /> Ver historial completo
                  </Button>
                  {selectedChat.reported && (
                    <Button size="sm" variant="outline" className="w-full text-xs h-8 border-rose-500/30 text-rose-500 hover:bg-rose-500/10">
                      <Flag className="h-3.5 w-3.5 mr-1.5" /> Escalar a admin
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-8">
                Haz clic en un chat para ver sus detalles
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
