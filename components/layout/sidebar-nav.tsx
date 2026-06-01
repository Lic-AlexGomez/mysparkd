"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Layers,
  Users,
  Radio,
  MessageCircle,
  Sparkles,
  Heart,
  User,
  LayoutDashboard,
  ShieldCheck,
  Crown,
  LayoutList,
  Link2,
  Zap,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useFeatureFlags } from "@/hooks/use-feature-flags"
import { useUnreadChats } from "@/hooks/use-unread-chats"
import { useI18n } from "@/lib/i18n"
import { useExperienceMode } from "@/hooks/use-experience-mode"
import type { ExperienceMode } from "@/hooks/use-experience-mode"

type NavItemDef = {
  href: string
  labelKey: string
  icon: LucideIcon
  modes: ExperienceMode[]
  featureFlag?: "groupsPage" | "tonightPage" | "mutualPlansPage" | "trelloPage"
}

/** Misma barra principal que móvil / bottom-nav */
const primaryNavItems: NavItemDef[] = [
  { href: "/feed", labelKey: "sidebar.feed", icon: Layers, modes: ["SOCIAL", "BOTH"] },
  {
    href: "/groups",
    labelKey: "sidebar.groups",
    icon: Users,
    modes: ["SOCIAL", "BOTH"],
    featureFlag: "groupsPage",
  },
  { href: "/events", labelKey: "sidebar.events", icon: Radio, modes: ["SOCIAL", "BOTH"] },
  { href: "/chat", labelKey: "sidebar.chat", icon: MessageCircle, modes: ["SOCIAL", "DATING", "BOTH"] },
  { href: "/swipes", labelKey: "sidebar.swipes", icon: Sparkles, modes: ["DATING", "BOTH"] },
  { href: "/matches", labelKey: "sidebar.matches", icon: Heart, modes: ["DATING", "BOTH"] },
  { href: "/profile", labelKey: "sidebar.profile", icon: User, modes: ["SOCIAL", "DATING", "BOTH"] },
]

/** Extras (no están en bottom nav móvil) */
const secondaryNavItems: NavItemDef[] = [
  {
    href: "/tonight",
    labelKey: "sidebar.tonight",
    icon: Sparkles,
    modes: ["SOCIAL", "DATING", "BOTH"],
    featureFlag: "tonightPage",
  },
  {
    href: "/mutual-plans",
    labelKey: "sidebar.mutualPlans",
    icon: Link2,
    modes: ["SOCIAL", "DATING", "BOTH"],
    featureFlag: "mutualPlansPage",
  },
  { href: "/premium", labelKey: "sidebar.premium", icon: Crown, modes: ["DATING", "BOTH"] },
  {
    href: "/trello",
    labelKey: "sidebar.trello",
    icon: LayoutList,
    modes: ["SOCIAL", "DATING", "BOTH"],
    featureFlag: "trelloPage",
  },
]

function filterNavItems(items: NavItemDef[], experienceMode: ExperienceMode, features: ReturnType<typeof useFeatureFlags>) {
  return items.filter((item) => {
    if (item.featureFlag === "groupsPage" && !features.groupsPage) return false
    if (item.featureFlag === "tonightPage" && !features.tonightPage) return false
    if (item.featureFlag === "mutualPlansPage" && !features.mutualPlansPage) return false
    if (item.featureFlag === "trelloPage" && !features.trelloPage) return false
    if (!item.modes.includes(experienceMode)) return false
    return true
  })
}

function NavLink({
  item,
  pathname,
  unreadChats,
  t,
}: {
  item: NavItemDef
  pathname: string
  unreadChats: number
  t: (key: string) => string
}) {
  const isActive =
    pathname === item.href ||
    pathname.startsWith(item.href + "/") ||
    (item.href === "/events" &&
      (pathname.startsWith("/tonight") || pathname.startsWith("/pulse"))) ||
    (item.href === "/matches" && pathname.startsWith("/likes"))

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
        <div className="relative z-10">
          <item.icon className="h-6 w-6 xl:h-5 xl:w-5" />
          {item.href === "/chat" && unreadChats > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-secondary px-0.5 text-[9px] font-bold text-secondary-foreground">
              {unreadChats > 99 ? "99+" : unreadChats}
            </span>
          )}
        </div>
        <span className="relative z-10 hidden xl:block">{t(item.labelKey)}</span>
      </Link>
    </li>
  )
}

export function SidebarNav() {
  const pathname = usePathname()
  const features = useFeatureFlags()
  const unreadChats = useUnreadChats()
  const { t } = useI18n()
  const experienceMode = useExperienceMode()

  const primary = filterNavItems(primaryNavItems, experienceMode, features)
  const secondary = filterNavItems(secondaryNavItems, experienceMode, features)

  const panelItem = features.dashboard
    ? { href: "/dashboard", labelKey: "sidebar.adminPanel", icon: LayoutDashboard }
    : features.managerPanel
      ? { href: "/manager", labelKey: "sidebar.managerPanel", icon: ShieldCheck }
      : null

  return (
    <aside className="hidden lg:flex lg:flex-col lg:fixed lg:left-0 lg:top-20 lg:bottom-0 lg:z-50 bg-gradient-to-b from-background via-background to-muted/20 border-r border-primary/10 lg:w-20 xl:w-72 shadow-xl shadow-primary/5">
      <div className="flex h-16 items-center justify-center xl:justify-start xl:gap-3 xl:px-6 border-b border-primary/10">
        <div className="relative">
          <div className="absolute inset-0 blur-xl bg-gradient-to-br from-primary to-secondary opacity-50" />
          <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary shadow-2xl">
            <Zap className="h-7 w-7 text-black" />
          </div>
        </div>
        <span className="hidden xl:block text-2xl font-black bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
          Sparkd
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 xl:px-4 py-6">
        <ul className="flex flex-col gap-3">
          {panelItem ? (
            <NavLink
              item={{
                href: panelItem.href,
                labelKey: panelItem.labelKey,
                icon: panelItem.icon,
                modes: ["SOCIAL", "DATING", "BOTH"],
              }}
              pathname={pathname}
              unreadChats={unreadChats}
              t={t}
            />
          ) : null}

          {primary.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} unreadChats={unreadChats} t={t} />
          ))}

          {secondary.length > 0 ? (
            <>
              <li className="hidden xl:block px-4 pt-4 pb-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">
                  {t("sidebar.more")}
                </span>
              </li>
              <li className="xl:hidden h-px bg-border/60 mx-2 my-1" aria-hidden />
              {secondary.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  pathname={pathname}
                  unreadChats={unreadChats}
                  t={t}
                />
              ))}
            </>
          ) : null}
        </ul>
      </nav>
    </aside>
  )
}
