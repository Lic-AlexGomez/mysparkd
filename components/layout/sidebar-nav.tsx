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
    <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:z-40 bg-gradient-to-b from-background via-background to-muted/20 border-r border-primary/10 lg:w-20 xl:w-72 shadow-xl shadow-primary/5">
      {/* Logo */}
      <div className="flex h-20 items-center justify-center xl:justify-start xl:gap-3 xl:px-6 border-b border-primary/10">
        <div className="relative">
          <div className="absolute inset-0 blur-xl bg-gradient-to-br from-primary to-secondary opacity-50" />
          <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary shadow-2xl">
            <Zap className="h-7 w-7 text-black" />
          </div>
        </div>
        <span className="hidden xl:block text-2xl font-black bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">Sparkd</span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-2 xl:px-4 py-6">
        <ul className="flex flex-col gap-3">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/")
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "group relative flex items-center justify-center xl:justify-start gap-4 rounded-2xl px-4 py-4 xl:py-3 text-sm font-semibold transition-all duration-300",
                    isActive
                      ? "bg-gradient-to-r from-primary to-secondary text-black shadow-lg shadow-primary/30 scale-105"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50 hover:scale-105"
                  )}
                >
                  {isActive && (
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary to-secondary blur-xl opacity-30" />
                  )}
                  <item.icon className="h-6 w-6 xl:h-5 xl:w-5 relative z-10" />
                  <span className="hidden xl:block relative z-10">{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}
