"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Newspaper,
  Flame,
  Heart,
  MessageCircle,
  User,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/feed", label: "Feed", icon: Newspaper },
  { href: "/swipes", label: "Swipes", icon: Flame },
  { href: "/matches", label: "Matches", icon: Heart },
  { href: "/chat", label: "Chat", icon: MessageCircle },
  { href: "/profile", label: "Perfil", icon: User },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-md lg:hidden">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 text-xs transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon
                className={cn("h-5 w-5", isActive && "fill-primary/20")}
              />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
