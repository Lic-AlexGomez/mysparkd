"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Newspaper,
  Flame,
  Heart,
  MessageCircle,
  User,
  Settings,
  Crown,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/feed", label: "Feed", icon: Newspaper },
  { href: "/swipes", label: "Swipes", icon: Flame },
  { href: "/matches", label: "Matches", icon: Heart },
  { href: "/chat", label: "Chat", icon: MessageCircle },
  { href: "/profile", label: "Mi Perfil", icon: User },
  { href: "/settings", label: "Configuracion", icon: Settings },
  { href: "/premium", label: "Premium", icon: Crown },
]

export function SidebarNav() {
  const pathname = usePathname()

  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:z-40 border-r border-border bg-card">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 px-6 border-b border-border">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Flame className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="text-xl font-bold text-foreground">Sparkd</span>
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
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
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
