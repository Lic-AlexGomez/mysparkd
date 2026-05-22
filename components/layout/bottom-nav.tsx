"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Layers, Ticket, Users, Radio, MessageCircle, Heart, User, Moon, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { useUnreadChats } from "@/hooks/use-unread-chats"
import { useAuth } from "@/lib/auth-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useState, useRef, useEffect } from "react"

const W = 420
const H = 64
// arch peak: wider and shallower curve
const PATH = `M 24 0 L 140 0 C 165 0, 185 -22, 210 -22 C 235 -22, 255 0, 280 0 L 396 0 Q 420 0 420 32 L 420 64 L 0 64 L 0 32 Q 0 0 24 0 Z`

function DropItem({ href, icon: Icon, label, onClick }: { href: string; icon: any; label: string; onClick: () => void }) {
  return (
    <Link href={href} onClick={onClick} className="flex items-center gap-2 px-4 py-2.5 hover:bg-white/10 transition-colors rounded-lg">
      <Icon className="h-4 w-4 text-cyan-400" />
      <span className="text-xs font-bold tracking-widest text-white uppercase">{label}</span>
    </Link>
  )
}

export function BottomNav() {
  const pathname = usePathname()
  const unreadChats = useUnreadChats()
  const { user } = useAuth()
/*   console.log("BottomNav user:", user) // Debug log to check user data
 */  const [openDrop, setOpenDrop] = useState<"events" | "swipes" | null>(null)
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpenDrop(null)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  if (pathname.startsWith('/chat/')) return null

  const toggle = (drop: "events" | "swipes") => setOpenDrop(prev => prev === drop ? null : drop)
  const isPulseActive = pathname === "/pulse" || pathname.startsWith("/pulse/")
  const isEventsActive = pathname.startsWith("/events") || pathname.startsWith("/tonight")
  const isSwipesActive = pathname.startsWith("/swipes") || pathname.startsWith("/matches")

  return (
    <nav
      ref={ref}
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 lg:hidden"
      style={{ width: W, filter: 'drop-shadow(0 0 1px rgba(0,229,255,0.7)) drop-shadow(0 0 6px rgba(139,92,246,0.4))' }}
    >
      {/* Events dropdown */}
      <div className={cn(
        "absolute bottom-[calc(100%-4px)] transition-all duration-200 origin-bottom",
        openDrop === "events" ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"
      )} style={{ left: '18%', transform: 'translateX(-50%)' }}>
        <div className="bg-black/90 backdrop-blur-xl border border-white/15 rounded-xl shadow-[0_0_30px_rgba(0,229,255,0.2)] py-1 min-w-[140px]">
          <DropItem href="/events" icon={Ticket} label="Eventos" onClick={() => setOpenDrop(null)} />
          <DropItem href="/tonight" icon={Moon} label="Tonight" onClick={() => setOpenDrop(null)} />
        </div>
      </div>

      {/* Swipes dropdown */}
      <div className={cn(
        "absolute bottom-[calc(100%-4px)] transition-all duration-200 origin-bottom",
        openDrop === "swipes" ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"
      )} style={{ right: '18%', transform: 'translateX(50%)' }}>
        <div className="bg-black/90 backdrop-blur-xl border border-white/15 rounded-xl shadow-[0_0_30px_rgba(139,92,246,0.2)] py-1 min-w-[140px]">
          <DropItem href="/matches" icon={Sparkles} label="Matches" onClick={() => setOpenDrop(null)} />
          <DropItem href="/swipes" icon={Heart} label="Swipes" onClick={() => setOpenDrop(null)} />
        </div>
      </div>

      {/* Wrapper with overflow visible so arch peak shows */}
      <div style={{ position: 'relative', width: W, overflow: 'visible' }}>

        {/* Backdrop blur behind bar */}
        <div style={{
          position: 'absolute', left: 0, right: 0, top: 22, bottom: 0,
          backdropFilter: 'blur(40px) saturate(180%)', WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          zIndex: 0, pointerEvents: 'none',
        }} />

        {/* SVG arch shape */}
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', overflow: 'visible', position: 'relative', zIndex: 1 }}>
          <defs>
            <linearGradient id="mBorderGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(255,255,255,0)" />
              <stop offset="50%" stopColor="rgba(255,255,255,0.35)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>
          </defs>
          <g transform="translate(0, 22)">
            <path d={PATH} fill="rgba(10,11,15,0.85)" />
            <path d={PATH} fill="none" stroke="rgba(0,229,255,0.35)" strokeWidth="1" />
          </g>
        </svg>

        {/* Pulse button — sits at arch peak */}
        <style>{`
          @keyframes heartbeat {
            0%   { transform: scale(1); }
            14%  { transform: scale(1.15); }
            28%  { transform: scale(1); }
            42%  { transform: scale(1.1); }
            70%  { transform: scale(1); }
            100% { transform: scale(1); }
          }
          .pulse-hb { animation: heartbeat 1.4s ease-in-out infinite; }
        `}</style>
        <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: -22, zIndex: 20, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontSize: 7, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(0,229,255,0.85)', textShadow: '0 0 8px rgba(0,229,255,0.7)', marginBottom: 3, whiteSpace: 'nowrap' }}>LIVE CITY ACTIVE</span>
          <Link href="/pulse" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <div className="pulse-hb" style={{ width: 72, height: 72, borderRadius: '50%', border: '1px solid rgba(249,115,22,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', border: '1px solid rgba(249,115,22,0.45)', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid #f97316', background: 'linear-gradient(145deg, #f97316 0%, #dc2626 100%)', boxShadow: '0 0 24px rgba(249,115,22,0.8), 0 0 48px rgba(234,88,12,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', filter: 'drop-shadow(0 0 10px rgba(249,115,22,0.8))' }}>
                  <Radio size={16} color="white" />
                </div>
              </div>
            </div>
            <span style={{ color: '#94a3b8', fontSize: 8, fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase' }}>THE PULSE</span>
          </Link>
        </div>

        {/* Nav items overlaid on bar */}
        <div style={{
          position: 'absolute', top: 22, left: 0, right: 0, height: H,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 12px', zIndex: 10,
        }}>
          {/* FEED */}
          <NavBtn href="/feed" icon={<Layers className="h-4 w-4" />} label="FEED" active={pathname.startsWith('/feed')} />

          {/* EVENTS */}
          <button onClick={() => toggle("events")} className={cn("flex flex-col items-center gap-0.5 px-1", isEventsActive ? "text-white" : "text-gray-500")}>
            <div className={cn("relative p-1.5 rounded-full transition-all duration-200", isEventsActive ? "bg-primary shadow-[0_0_12px_rgba(139,92,246,0.8)]" : "", openDrop === "events" ? "translate-y-0.5" : "")}>
              <Ticket className="h-4 w-4" />
            </div>
            <span className="text-[7px] font-bold tracking-wide">EVENTS</span>
          </button>

          {/* GROUPS */}
          <NavBtn href="/groups" icon={<Users className="h-4 w-4" />} label="GROUPS" active={pathname.startsWith('/groups')} />

          {/* Spacer for arch */}
          <div style={{ width: 56, flexShrink: 0 }} />

          {/* SWIPES */}
          <button onClick={() => toggle("swipes")} className={cn("flex flex-col items-center gap-0.5 px-1", isSwipesActive ? "text-white" : "text-gray-500")}>
            <div className={cn("relative p-1.5 rounded-full transition-all duration-200", isSwipesActive ? "bg-white/10" : "", openDrop === "swipes" ? "translate-y-0.5" : "")}>
              <Heart className="h-4 w-4" />
            </div>
            <span className="text-[7px] font-bold tracking-wide">SWIPES</span>
          </button>

          {/* CHAT */}
          <NavBtn href="/chat" icon={<MessageCircle className="h-4 w-4" />} label="CHAT" active={pathname.startsWith('/chat')} badge={unreadChats} />

          {/* PROFILE */}
          <Link href="/profile" className={cn("flex flex-col items-center gap-0.5 px-1", pathname === "/profile" ? "text-white" : "text-gray-500")}>
            <div className={cn("relative p-0.5 rounded-full", pathname === "/profile" ? "ring-2 ring-primary" : "")}>
              <Avatar className="h-7 w-7">
                <AvatarImage src={user?.profilePictureUrl} alt={user?.nombres} className="object-cover" />
                <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                  {user?.nombres?.[0]?.toUpperCase() || <User className="h-3 w-3" />}
                </AvatarFallback>
              </Avatar>
            </div>
            <span className={cn("text-[7px] font-bold tracking-wide max-w-[2.5rem] truncate", pathname === "/profile" ? "text-white" : "text-gray-500")}>
              {user?.nombres || "PROFILE"}
            </span>
          </Link>
        </div>
      </div>
    </nav>
  )
}

function NavBtn({ href, icon, label, active, badge }: { href: string; icon: React.ReactNode; label: string; active: boolean; badge?: number }) {
  return (
    <Link href={href} className={cn("flex flex-col items-center gap-0.5 px-1", active ? "text-white" : "text-gray-500")}>
      <div className={cn("relative p-1.5 rounded-full", active ? "bg-white/10" : "")}>
        {icon}
        {!!badge && badge > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-secondary text-[8px] font-bold text-black px-0.5">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </div>
      <span className="text-[7px] font-bold tracking-wide">{label}</span>
    </Link>
  )
}
