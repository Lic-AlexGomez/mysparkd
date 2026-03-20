// Componentes compartidos del dashboard admin
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowUpRight, ArrowDownRight } from "lucide-react"
import { LucideIcon } from "lucide-react"

export function StatCard({
  label, value, change, icon: Icon, color, sub
}: {
  label: string
  value: string
  change?: number
  icon: LucideIcon
  color: string
  sub?: string
}) {
  const positive = (change ?? 0) >= 0
  return (
    <Card className="border-border">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${color}`}>
            <Icon className="h-4 w-4 text-white" />
          </div>
          {change !== undefined && (
            <Badge className={`text-xs border-0 flex items-center gap-0.5 ${positive ? "bg-emerald-500/15 text-emerald-500" : "bg-rose-500/15 text-rose-500"}`}>
              {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {Math.abs(change)}%
            </Badge>
          )}
        </div>
        <p className="text-2xl font-black text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
        {sub && <p className="text-[11px] text-muted-foreground/60 mt-1">{sub}</p>}
      </CardContent>
    </Card>
  )
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">{children}</h2>
}

export function MiniBar({ data, color = "bg-primary" }: { data: number[], color?: string }) {
  const max = Math.max(...data)
  return (
    <div className="flex items-end gap-1 h-12">
      {data.map((v, i) => (
        <div key={i} className="flex-1 flex items-end">
          <div
            className={`w-full rounded-sm ${color} opacity-80`}
            style={{ height: `${(v / max) * 100}%`, minHeight: 2 }}
          />
        </div>
      ))}
    </div>
  )
}

export function ProgressRow({ label, value, max, color = "bg-primary" }: {
  label: string, value: number, max: number, color?: string
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground w-24 shrink-0 truncate">{label}</span>
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${(value / max) * 100}%` }} />
      </div>
      <span className="text-xs font-semibold text-foreground w-10 text-right">{value.toLocaleString()}</span>
    </div>
  )
}

export function TableRow({ cols, highlight }: { cols: React.ReactNode[], highlight?: boolean }) {
  return (
    <div className={`grid gap-2 px-3 py-2.5 rounded-lg text-xs ${highlight ? "bg-muted/40" : "hover:bg-muted/20"} transition-colors`}
      style={{ gridTemplateColumns: `repeat(${cols.length}, minmax(0, 1fr))` }}>
      {cols.map((c, i) => <div key={i}>{c}</div>)}
    </div>
  )
}
