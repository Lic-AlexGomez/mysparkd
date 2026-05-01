"use client"

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Legend,
  ComposedChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"

const TICK = { fill: "#8b92a8", fontSize: 11 }
const GRID = { stroke: "#2a2b35", strokeOpacity: 0.85 }

const tooltipBox: React.CSSProperties = {
  backgroundColor: "#13141a",
  border: "1px solid #2a2b35",
  borderRadius: "12px",
  fontSize: "12px",
  color: "#e0f7fa",
  boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
}

export type NamedValue = { name: string; value: number }

export function AdminAreaChart({
  data,
  color = "#00e5ff",
  gradientId,
  valueLabel = "Valor",
  height = 220,
  formatValue,
}: {
  data: NamedValue[]
  color?: string
  gradientId: string
  valueLabel?: string
  height?: number
  formatValue?: (n: number) => string
}) {
  const fmt = formatValue ?? ((n: number) => n.toLocaleString("es-ES", { maximumFractionDigits: 2 }))
  if (!data.length) {
    return (
      <div className="flex items-center justify-center text-xs text-muted-foreground" style={{ height }}>
        Sin datos
      </div>
    )
  }
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 4 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.4} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid {...GRID} vertical={false} />
        <XAxis
          dataKey="name"
          tick={TICK}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
          height={36}
        />
        <YAxis tick={TICK} axisLine={false} tickLine={false} width={44} />
        <Tooltip
          contentStyle={tooltipBox}
          labelStyle={{ color: "#8b92a8", marginBottom: 4, fontSize: 11 }}
          formatter={(v: number | string) => [fmt(Number(v)), valueLabel]}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          activeDot={{ r: 4, strokeWidth: 0, fill: color }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export type DualEngagementPoint = { name: string; likes: number; matches: number }

export function AdminEngagementComboChart({
  data,
  height = 260,
}: {
  data: DualEngagementPoint[]
  height?: number
}) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center text-xs text-muted-foreground" style={{ height }}>
        Sin datos
      </div>
    )
  }
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 4 }}>
        <CartesianGrid {...GRID} vertical={false} />
        <XAxis
          dataKey="name"
          tick={TICK}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
          height={36}
        />
        <YAxis tick={TICK} axisLine={false} tickLine={false} width={44} />
        <Tooltip contentStyle={tooltipBox} labelStyle={{ color: "#8b92a8", fontSize: 11 }} />
        <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} iconType="circle" iconSize={8} />
        <Area
          type="monotone"
          dataKey="likes"
          name="Likes"
          stroke="#fb7185"
          fill="#fb7185"
          fillOpacity={0.12}
          strokeWidth={2}
        />
        <Line
          type="monotone"
          dataKey="matches"
          name="Matches"
          stroke="#60a5fa"
          strokeWidth={2.5}
          dot={{ r: 3, fill: "#60a5fa", strokeWidth: 0 }}
          activeDot={{ r: 5 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}

export function AdminColumnBarChart({
  data,
  color = "#fbbf24",
  height = 200,
  valueLabel = "Valor",
}: {
  data: NamedValue[]
  color?: string
  height?: number
  valueLabel?: string
}) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center text-xs text-muted-foreground" style={{ height }}>
        Sin datos
      </div>
    )
  }
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 4 }}>
        <CartesianGrid {...GRID} vertical={false} />
        <XAxis dataKey="name" tick={TICK} axisLine={false} tickLine={false} height={28} />
        <YAxis tick={TICK} axisLine={false} tickLine={false} width={40} />
        <Tooltip
          contentStyle={tooltipBox}
          formatter={(v: number) => [v.toLocaleString("es-ES"), valueLabel]}
        />
        <Bar dataKey="value" fill={color} radius={[8, 8, 0, 0]} maxBarSize={52} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function AdminHorizontalBarChart({
  data,
  barColor = "#00e5ff",
  height: heightProp,
}: {
  data: NamedValue[]
  barColor?: string
  height?: number
}) {
  const sorted = [...data].sort((a, b) => b.value - a.value).slice(0, 12)
  const height = heightProp ?? Math.min(400, Math.max(200, sorted.length * 32 + 80))
  if (!sorted.length) {
    return (
      <div className="flex items-center justify-center text-xs text-muted-foreground" style={{ height: 220 }}>
        Sin datos
      </div>
    )
  }
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        layout="vertical"
        data={sorted}
        margin={{ top: 8, right: 24, left: 4, bottom: 8 }}
      >
        <CartesianGrid {...GRID} horizontal={false} />
        <XAxis type="number" tick={TICK} axisLine={false} tickLine={false} />
        <YAxis
          type="category"
          dataKey="name"
          width={108}
          tick={TICK}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={tooltipBox}
          formatter={(v: number) => [v.toLocaleString("es-ES"), "Usuarios"]}
        />
        <Bar dataKey="value" fill={barColor} radius={[0, 8, 8, 0]} maxBarSize={22} />
      </BarChart>
    </ResponsiveContainer>
  )
}

const DONUT_PALETTE = ["#34d399", "#fb7185", "#a78bfa", "#fbbf24", "#00e5ff"]

export function AdminDonutChart({
  data,
  height = 220,
}: {
  data: { name: string; value: number }[]
  height?: number
}) {
  if (!data.length || data.every((d) => d.value === 0)) {
    return (
      <div className="flex items-center justify-center text-xs text-muted-foreground" style={{ height }}>
        Sin datos
      </div>
    )
  }
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={54}
          outerRadius={78}
          paddingAngle={2}
          dataKey="value"
          stroke="#13141a"
          strokeWidth={2}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={DONUT_PALETTE[i % DONUT_PALETTE.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={tooltipBox}
          formatter={(v: number, name: string) => [Number(v).toLocaleString("es-ES"), name]}
        />
        <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" iconSize={8} />
      </PieChart>
    </ResponsiveContainer>
  )
}
