"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Newspaper,
  Zap,
  Heart,
  MessageCircle,
  User,
  Settings,
  Crown,
  Bookmark,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/feed", label: "Feed", icon: Newspaper },
  { href: "/swipes", label: "Swipes", icon: Zap },
  { href: "/matches", label: "Matches", icon: Heart },
  { href: "/chat", label: "Chat", icon: MessageCircle },
  { href: "/saved", label: "Guardados", icon: Bookmark },
  { href: "/profile", label: "Mi Perfil", icon: User },
  { href: "/settings", label: "Configuracion", icon: Settings },
  { href: "/premium", label: "Premium", icon: Crown },
]

export function SidebarNav() {
  const pathname = usePathname()

  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:z-40 border-r border-border bg-card shadow-[2px_0_8px_rgba(0,229,255,0.05)]">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 px-6 border-b border-border">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary shadow-[0_0_20px_rgba(0,229,255,0.3)]">
          <Zap className="h-5 w-5 text-black" />
        </div>
        <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Sparkd</span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4">
        <ul className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/")
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary shadow-[0_0_12px_rgba(0,229,255,0.2)] border border-primary/20"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground hover:border hover:border-border"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}
