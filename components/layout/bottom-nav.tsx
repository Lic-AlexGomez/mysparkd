"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Newspaper, Zap, Calendar, MessageCircle, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { useUnreadChats } from "@/hooks/use-unread-chats"

const navItems = [
  { href: "/feed",     label: "Feed",    icon: Newspaper },
  { href: "/swipes",   label: "Swipes",  icon: Zap },
  { href: "/fastdate", label: "Citas",   icon: Calendar },
  { href: "/chat",     label: "Chat",    icon: MessageCircle },
  { href: "/profile",  label: "Perfil",  icon: User },
]

export function BottomNav() {
  const pathname = usePathname()
  const unreadChats = useUnreadChats()

  if (pathname.startsWith('/chat/')) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-md lg:hidden">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          const showBadge = item.href === '/chat' && unreadChats > 0
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 text-xs transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="relative">
                <item.icon className={cn("h-5 w-5", isActive && "fill-primary/20")} />
                {showBadge && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-secondary text-[9px] font-bold text-secondary-foreground px-0.5">
                    {unreadChats > 99 ? '99+' : unreadChats}
                  </span>
                )}
              </div>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
