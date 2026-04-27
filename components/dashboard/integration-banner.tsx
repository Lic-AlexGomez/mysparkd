import { AlertCircle, CheckCircle2, LayoutTemplate } from "lucide-react"
import { cn } from "@/lib/utils"
import type { DashboardIntegrationSource } from "@/lib/dashboard-section-integration"

const STYLES: Record<
  DashboardIntegrationSource,
  { icon: typeof CheckCircle2; className: string; title: string }
> = {
  live: {
    icon: CheckCircle2,
    className:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-200 [&_svg]:text-emerald-400",
    title: "Conectado al backend",
  },
  partial: {
    icon: AlertCircle,
    className: "border-amber-500/30 bg-amber-500/10 text-amber-100 [&_svg]:text-amber-400",
    title: "Parcialmente conectado",
  },
  demo: {
    icon: LayoutTemplate,
    className: "border-border bg-muted/50 text-foreground/90 [&_svg]:text-muted-foreground",
    title: "Vista de demostración",
  },
}

type Props = {
  source: DashboardIntegrationSource
  detail: string
  className?: string
}

export function IntegrationBanner({ source, detail, className }: Props) {
  const s = STYLES[source]
  const Icon = s.icon
  return (
    <div
      role="status"
      className={cn(
        "flex gap-3 rounded-2xl border px-4 py-3 text-sm leading-snug",
        s.className,
        className
      )}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
      <div className="min-w-0">
        <p className="font-semibold tracking-tight">{s.title}</p>
        <p className="mt-0.5 text-xs opacity-90 [&_strong]:font-medium [&_strong]:text-inherit">
          {detail}
        </p>
      </div>
    </div>
  )
}
