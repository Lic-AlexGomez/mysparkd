"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Layers, Ticket, Users, Radio, MessageCircle, Heart, User, Moon, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { useUnreadChats } from "@/hooks/use-unread-chats"
import { useAuth } from "@/lib/auth-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useState, useRef, useEffect } from "react"

const W = 150
const H = 20
const ARCH_TOP = 5
const ARCH_PEAK = -4
const PATH = `M 6 0 L 49 0 C 58 0, 66 ${ARCH_PEAK}, 75 ${ARCH_PEAK} C 84 ${ARCH_PEAK}, 92 0, 101 0 L 144 0 Q 150 0 150 10 L 150 20 L 0 20 L 0 10 Q 0 0 6 0 Z`
const ICON = "h-2 w-2"
const LABEL = "text-[4px] font-bold tracking-wide leading-none"
const PULSE = "h-[18px] w-[18px]"
const PULSE_ICON = "h-2 w-2"
const CENTER_GAP = "w-[18px]"

function DropItem({ href, icon: Icon, label, onClick }: { href: string; icon: React.ComponentType<{ className?: string }>; label: string; onClick: () => void }) {
  return (
    <Link href={href} onClick={onClick} className="flex items-center gap-0.5 px-1.5 py-1 hover:bg-white/10 transition-colors rounded-sm">
      <Icon className="h-2 w-2 text-cyan-400" />
      <span className="text-[7px] font-bold tracking-wide text-white uppercase">{label}</span>
    </Link>
  )
}

export function BottomNav() {
  const pathname = usePathname()
  const unreadChats = useUnreadChats()
  const { user } = useAuth()
  const [openDrop, setOpenDrop] = useState<"events" | "swipes" | null>(null)
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpenDrop(null)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  if (pathname.startsWith("/chat/")) return null

  const toggle = (drop: "events" | "swipes") => setOpenDrop((prev) => (prev === drop ? null : drop))
  const isEventsActive = pathname.startsWith("/events") || pathname.startsWith("/tonight")
  const isSwipesActive = pathname.startsWith("/swipes") || pathname.startsWith("/matches")

  return (
    <nav
      ref={ref}
      className="fixed bottom-1 left-1/2 z-50 max-w-[calc(100vw-20px)] -translate-x-1/2 lg:hidden"
      style={{
        width: W,
        filter: "drop-shadow(0 0 1px rgba(0,229,255,0.5)) drop-shadow(0 0 4px rgba(139,92,246,0.25))",
      }}
    >
      <div
        className={cn(
          "absolute bottom-[calc(100%-2px)] transition-all duration-200 origin-bottom",
          openDrop === "events" ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"
        )}
        style={{ left: "18%", transform: "translateX(-50%)" }}
      >
        <div className="bg-black/90 backdrop-blur-xl border border-white/15 rounded-sm py-0.5 min-w-[72px]">
          <DropItem href="/events" icon={Ticket} label="Eventos" onClick={() => setOpenDrop(null)} />
          <DropItem href="/tonight" icon={Moon} label="Tonight" onClick={() => setOpenDrop(null)} />
        </div>
      </div>

      <div
        className={cn(
          "absolute bottom-[calc(100%-2px)] transition-all duration-200 origin-bottom",
          openDrop === "swipes" ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"
        )}
        style={{ right: "18%", transform: "translateX(50%)" }}
      >
        <div className="bg-black/90 backdrop-blur-xl border border-white/15 rounded-sm py-0.5 min-w-[72px]">
          <DropItem href="/matches" icon={Sparkles} label="Matches" onClick={() => setOpenDrop(null)} />
          <DropItem href="/swipes" icon={Heart} label="Swipes" onClick={() => setOpenDrop(null)} />
        </div>
      </div>

      <div className="relative overflow-visible" style={{ width: W }}>
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 top-[5px] backdrop-blur-xl"
          style={{ WebkitBackdropFilter: "blur(24px) saturate(160%)" }}
        />

        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="relative z-[1] block overflow-visible">
          <g transform={`translate(0, ${ARCH_TOP})`}>
            <path d={PATH} fill="rgba(10,11,15,0.9)" />
            <path d={PATH} fill="none" stroke="rgba(0,229,255,0.3)" strokeWidth="0.75" />
          </g>
        </svg>

        {/* Pulse — compacto, sin anillos triples */}
        <div
          className="absolute left-1/2 z-20 flex -translate-x-1/2 flex-col items-center"
          style={{ top: -3 }}
        >
          <Link
            href="/pulse"
            className="flex flex-col items-center gap-0"
            aria-label="The Pulse"
          >
            <div
              className={cn(
                "flex items-center justify-center rounded-full border border-orange-500/50 bg-gradient-to-br from-orange-500 to-red-600 shadow-[0_0_6px_rgba(249,115,22,0.55)]",
                PULSE
              )}
            >
              <Radio className={cn(PULSE_ICON, "text-white")} strokeWidth={2.5} />
            </div>
            <span className={`${LABEL} text-slate-400`}>PULSE</span>
          </Link>
        </div>

        <div
          className="absolute inset-x-0 z-10 flex items-center justify-between px-1.5"
          style={{ top: ARCH_TOP, height: H }}
        >
          <NavBtn href="/feed" icon={<Layers className={ICON} />} label="FEED" active={pathname.startsWith("/feed")} />

          <button
            type="button"
            onClick={() => toggle("events")}
            className={cn("flex flex-col items-center px-0.5", isEventsActive ? "text-white" : "text-gray-500")}
          >
            <div
              className={cn(
                "rounded-full p-0.5",
                isEventsActive && "bg-primary shadow-[0_0_8px_rgba(139,92,246,0.6)]"
              )}
            >
              <Ticket className={ICON} />
            </div>
            <span className={LABEL}>EVENTS</span>
          </button>

          <NavBtn href="/groups" icon={<Users className={ICON} />} label="GROUPS" active={pathname.startsWith("/groups")} />

          <div className={cn(CENTER_GAP, "shrink-0")} aria-hidden />

          <button
            type="button"
            onClick={() => toggle("swipes")}
            className={cn("flex flex-col items-center px-0.5", isSwipesActive ? "text-white" : "text-gray-500")}
          >
            <div className={cn("rounded-full p-0.5", isSwipesActive && "bg-white/10")}>
              <Heart className={ICON} />
            </div>
            <span className={LABEL}>SWIPES</span>
          </button>

          <NavBtn
            href="/chat"
            icon={<MessageCircle className={ICON} />}
            label="CHAT"
            active={pathname.startsWith("/chat")}
            badge={unreadChats}
          />

          <Link
            href="/profile"
            className={cn(
              "flex flex-col items-center px-0.5",
              pathname === "/profile" ? "text-white" : "text-gray-500"
            )}
          >
            <Avatar className={cn("h-2.5 w-2.5", pathname === "/profile" && "ring-1 ring-primary")}>
              <AvatarImage src={user?.profilePictureUrl} alt={user?.nombres} className="object-cover" />
              <AvatarFallback className="bg-primary/20 text-primary text-[6px] font-bold">
                {user?.nombres?.[0]?.toUpperCase() || <User className="h-1.5 w-1.5" />}
              </AvatarFallback>
            </Avatar>
            <span className={cn(LABEL, "max-w-[1.25rem] truncate")}>{user?.nombres?.slice(0, 4) || "ME"}</span>
          </Link>
        </div>
      </div>
    </nav>
  )
}

function NavBtn({
  href,
  icon,
  label,
  active,
  badge,
}: {
  href: string
  icon: React.ReactNode
  label: string
  active: boolean
  badge?: number
}) {
  return (
    <Link href={href} className={cn("flex flex-col items-center px-0.5", active ? "text-white" : "text-gray-500")}>
      <div className={cn("relative rounded-full p-0.5", active && "bg-white/10")}>
        {icon}
        {!!badge && badge > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-2 min-w-2 items-center justify-center rounded-full bg-secondary px-0.5 text-[5px] font-bold text-black">
            {badge > 9 ? "9+" : badge}
          </span>
        )}
      </div>
      <span className={LABEL}>{label}</span>
    </Link>
  )
}
