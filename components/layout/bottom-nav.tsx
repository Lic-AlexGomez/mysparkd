"use client"

import type { ReactNode } from "react"
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
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useUnreadChats } from "@/hooks/use-unread-chats"
import { useAuth } from "@/lib/auth-context"
import { useExperienceMode } from "@/hooks/use-experience-mode"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAppearanceOptional } from "@/lib/appearance/appearance-provider"
import { DEFAULT_UI_PREFERENCES, type NavbarStyle, type UiPreferences } from "@/lib/appearance/types"

type NavKey = "feed" | "groups" | "chat" | "swipes" | "matches" | "profile"

type SideNavItem = {
  key: NavKey
  href: string
  label: string
  icon: LucideIcon
  isActive: (pathname: string) => boolean
  badge?: number
  avatar?: boolean
}

const PRESETS = {
  mobile: {
    w: 420,
    h: 64,
    shellH: 64,
    barOffset: 22,
    navTop: 22,
    navHeight: 42,
    centerGap: 56,
    pulseTop: -18,
    navPx: 8,
    path: `M 24 0 L 140 0 C 165 0, 185 -22, 210 -22 C 235 -22, 255 0, 280 0 L 396 0 Q 420 0 420 32 L 420 64 L 0 64 L 0 32 Q 0 0 24 0 Z`,
    iconClass: "h-4 w-4",
    iconSlot: 28,
    avatarPx: 28,
    labelMinH: 12,
    navClass: "bottom-4",
    glow: "drop-shadow(0 0 1px rgba(0,229,255,0.7)) drop-shadow(0 0 6px rgba(139,92,246,0.4))",
    pulse: { outer: 56, mid: 44, core: 32 },
    labelClass: "text-[7px] font-bold tracking-wide leading-none",
    eventsLabelClass: "text-[7px] font-bold uppercase tracking-[0.2em]",
    liveClass: "text-[7px] font-extrabold uppercase tracking-[0.18em] text-cyan-400/90",
    hoverNav: false,
  },
  desktop: {
    w: 640,
    h: 88,
    shellH: 125,
    barOffset: 38,
    navTop: 75,
    navHeight: 50,
    centerGap: 92,
    pulseTop: 4,
    navPx: 28,
    path: `M 34 0 L 260 0 C 274 0, 297 -20, 320 -20 C 343 -20, 366 0, 381 0 L 606 0 Q 640 0 640 41 L 640 82 Q 640 82 606 82 L 34 82 Q 0 82 0 41 L 0 0 Q 0 0 34 0 Z`,
    iconClass: "h-[22px] w-[22px]",
    iconSlot: 40,
    avatarPx: 40,
    labelMinH: 28,
    navClass: "bottom-2",
    glow: "drop-shadow(0 0 1px rgba(0,229,255,0.8)) drop-shadow(0 0 3px rgba(139,92,246,0.5))",
    pulse: { outer: 62, mid: 46, core: 40 },
    labelClass: "text-[10px] font-bold uppercase tracking-[0.2em] leading-none",
    eventsLabelClass: "text-[10px] font-bold uppercase tracking-[0.25em]",
    liveClass:
      "text-[9px] font-extrabold uppercase tracking-[0.22em] text-cyan-400/85 [text-shadow:0_0_8px_rgba(0,229,255,0.7)]",
    hoverNav: true,
  },
} as const

type NavPreset = (typeof PRESETS)[keyof typeof PRESETS]

/** Tamaños reducidos para la preview embebida del onboarding (dock desktop). */
function getPreviewPreset(visibility: keyof typeof PRESETS, embedded?: boolean): NavPreset {
  const base = PRESETS[visibility]
  if (!embedded || visibility !== "desktop") return base
  return {
    ...base,
    shellH: 108,
    barOffset: 28,
    navTop: 56,
    navHeight: 40,
    centerGap: 68,
    navPx: 12,
    iconClass: "h-4 w-4",
    iconSlot: 28,
    avatarPx: 28,
    labelMinH: 14,
    pulse: { outer: 44, mid: 34, core: 24 },
    labelClass: "text-[8px] font-bold uppercase tracking-[0.16em] leading-none",
    eventsLabelClass: "text-[8px] font-bold uppercase tracking-[0.2em]",
    liveClass: "text-[8px] font-extrabold uppercase tracking-[0.18em] text-cyan-400/85",
  }
}

function getNavbarShell(style: NavbarStyle) {
  switch (style) {
    case "glass":
      return {
        navClassExtra: "bottom-5",
        glow: "drop-shadow(0 0 12px color-mix(in srgb, var(--primary) 45%, transparent))",
        pathFill: "rgba(10,11,15,0.55)",
        pathStroke: "color-mix(in srgb, var(--primary) 50%, transparent)",
        backdrop: "backdrop-blur-2xl bg-white/[0.04]",
      }
    case "gradient":
      return {
        navClassExtra: "bottom-4",
        glow: "drop-shadow(0 0 10px color-mix(in srgb, var(--secondary) 40%, transparent))",
        pathFill: "rgba(8,8,12,0.88)",
        pathStroke: "url(#navGradStroke)",
        backdrop: "backdrop-blur-xl",
      }
    case "dock":
      return {
        navClassExtra: "bottom-6",
        glow: "drop-shadow(0 8px 24px rgba(0,0,0,0.55)) drop-shadow(0 0 12px color-mix(in srgb, var(--primary) 35%, transparent))",
        pathFill: "rgba(12,12,18,0.92)",
        pathStroke: "rgba(255,255,255,0.12)",
        backdrop: "backdrop-blur-md",
      }
    case "flat":
      return {
        navClassExtra: "bottom-3",
        glow: undefined,
        pathFill: "var(--card)",
        pathStroke: "var(--border)",
        backdrop: "",
      }
    case "pill":
      return {
        navClassExtra: "bottom-4",
        glow: "drop-shadow(0 0 8px color-mix(in srgb, var(--primary) 30%, transparent))",
        pathFill: "rgba(10,11,15,0.9)",
        pathStroke: "var(--border)",
        backdrop: "backdrop-blur-lg",
      }
    case "minimal":
      return {
        navClassExtra: "bottom-3",
        glow: undefined,
        pathFill: "rgba(10,11,15,0.75)",
        pathStroke: "transparent",
        backdrop: "",
      }
    default:
      return {
        navClassExtra: "",
        glow: undefined,
        pathFill: "rgba(10,11,15,0.82)",
        pathStroke: "color-mix(in srgb, var(--primary) 35%, transparent)",
        backdrop: "backdrop-blur-xl",
      }
  }
}

function IconSlot({
  preset,
  children,
  className,
}: {
  preset: (typeof PRESETS)[keyof typeof PRESETS]
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn("flex shrink-0 items-center justify-center", className)}
      style={{ width: preset.iconSlot, height: preset.iconSlot }}
    >
      {children}
    </div>
  )
}

function LabelSlot({
  preset,
  children,
}: {
  preset: (typeof PRESETS)[keyof typeof PRESETS]
  children: ReactNode
}) {
  return (
    <div
      className="mt-1 flex w-full flex-col items-center justify-start gap-0.5"
      style={{ minHeight: preset.labelMinH }}
    >
      {children}
    </div>
  )
}

function NavBtn({
  href,
  Icon,
  label,
  active,
  badge,
  preset,
  showLabels = true,
  navbarStyle = "default",
  activeIndicator = "dot",
}: {
  href: string
  Icon: LucideIcon
  label: string
  active: boolean
  badge?: number
  preset: (typeof PRESETS)[keyof typeof PRESETS]
  showLabels?: boolean
  navbarStyle?: NavbarStyle
  activeIndicator?: UiPreferences["activeIndicator"]
}) {
  const icon = <Icon className={preset.iconClass} strokeWidth={2} />
  const activeWrapClass = cn(
    "relative flex items-center justify-center",
    active &&
      (navbarStyle === "pill"
        ? "rounded-full bg-primary/20 px-2 py-1 ring-1 ring-primary/40"
        : activeIndicator === "glow"
          ? "rounded-full p-1 shadow-[0_0_12px_color-mix(in_srgb,var(--primary)_55%,transparent)]"
          : "rounded-full bg-white/10 p-1")
  )

  if (preset.hoverNav) {
    return (
      <Link
        href={href}
        className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end px-1 pb-0.5"
      >
        <IconSlot preset={preset}>
          <div
            className={cn(
              "relative flex items-center justify-center transition-[color,transform] duration-200 group-hover:scale-110 group-hover:text-white",
              active ? "text-white" : "text-white/40"
            )}
          >
            {icon}
            {!!badge && badge > 0 && (
              <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#0b0b16] bg-red-500" />
            )}
          </div>
        </IconSlot>
        {showLabels && (
          <LabelSlot preset={preset}>
            <span
              className={cn(
                preset.labelClass,
                "text-center transition-colors group-hover:text-white",
                active ? "text-white" : "text-white/40",
                activeIndicator === "underline" && active && "border-b border-primary"
              )}
            >
              {label}
            </span>
          </LabelSlot>
        )}
      </Link>
    )
  }

  return (
    <Link
      href={href}
      className={cn(
        "flex h-full min-w-0 flex-1 flex-col items-center justify-end px-0.5 pb-0.5",
        active ? "text-primary" : "text-gray-500"
      )}
    >
      <IconSlot preset={preset}>
        <div className={activeWrapClass}>
          {icon}
          {!!badge && badge > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-secondary px-0.5 text-[8px] font-bold text-black">
              {badge > 99 ? "99+" : badge}
            </span>
          )}
        </div>
      </IconSlot>
      {showLabels && (
        <LabelSlot preset={preset}>
          <span
            className={cn(
              "w-full truncate text-center",
              preset.labelClass,
              activeIndicator === "underline" && active && "border-b border-primary"
            )}
          >
            {label}
          </span>
        </LabelSlot>
      )}
    </Link>
  )
}

export function SparkdNavBar({
  visibility,
  embedded,
  previewUiPrefs,
  previewPathname,
}: {
  visibility: "mobile" | "desktop"
  embedded?: boolean
  previewUiPrefs?: UiPreferences
  previewPathname?: string
}) {
  const preset = getPreviewPreset(visibility, embedded)
  const { w: W, h: H, shellH, barOffset, navTop, navHeight, centerGap: CENTER_GAP, path: PATH } = preset
  const appearance = useAppearanceOptional()
  const uiPrefs = previewUiPrefs ?? appearance?.uiPrefs ?? DEFAULT_UI_PREFERENCES
  const shell = getNavbarShell(uiPrefs.navbarStyle)
  const showLabels = uiPrefs.showLabels !== false
  const hideLive = uiPrefs.hideLiveIndicator

  const pathnameFromRouter = usePathname()
  const pathname = previewPathname ?? pathnameFromRouter
  const unreadChats = useUnreadChats()
  const { user } = useAuth()
  const experienceMode = useExperienceMode()
  const showDatingItems = embedded ? true : experienceMode === "DATING" || experienceMode === "BOTH"
  const profileSub = user?.username || user?.nombres || ""

  if (!embedded && pathnameFromRouter.startsWith("/chat/")) return null

  const isEventsActive =
    pathname.startsWith("/events") ||
    pathname.startsWith("/tonight") ||
    pathname === "/pulse" ||
    pathname.startsWith("/pulse/")

  const leftItems: SideNavItem[] = [
    {
      key: "feed",
      href: "/feed",
      label: "FEED",
      icon: Layers,
      isActive: (p) => p.startsWith("/feed"),
    },
    {
      key: "groups",
      href: "/groups",
      label: "GROUPS",
      icon: Users,
      isActive: (p) => p.startsWith("/groups"),
    },
    {
      key: "chat",
      href: "/chat",
      label: "CHAT",
      icon: MessageCircle,
      isActive: (p) => p === "/chat" || (p.startsWith("/chat") && !p.startsWith("/chat/")),
      badge: unreadChats,
    },
  ]

  const rightItems: SideNavItem[] = [
    ...(showDatingItems
      ? [
          {
            key: "swipes" as const,
            href: "/swipes",
            label: "SWIPES",
            icon: Sparkles,
            isActive: (p: string) => p.startsWith("/swipes"),
          },
          {
            key: "matches" as const,
            href: "/matches",
            label: "MATCHES",
            icon: Heart,
            isActive: (p: string) => p.startsWith("/matches"),
          },
        ]
      : []),
    {
      key: "profile",
      href: "/profile",
      label: (user?.nombres?.slice(0, 6) || "PROFILE").toUpperCase(),
      icon: User,
      isActive: (p) => p === "/profile" || p.startsWith("/profile/"),
      avatar: true,
    },
  ]

  const eventsItem: SideNavItem = {
    key: "events",
    href: "/events",
    label: "EVENTS",
    icon: Radio,
    isActive: () => isEventsActive,
  }

  const linearItems: SideNavItem[] = [
    leftItems[0],
    leftItems[1],
    eventsItem,
    leftItems[2],
    ...(showDatingItems ? rightItems.filter((i) => i.key === "swipes" || i.key === "matches") : []),
    rightItems.find((i) => i.key === "profile")!,
  ]

  const visibilityClass = visibility === "mobile" ? "lg:hidden" : "hidden lg:block"
  const profileActive = rightItems.find((i) => i.key === "profile")?.isActive(pathname) ?? false

  const navGlow = shell.glow ?? preset.glow
  const navPositionClass = embedded
    ? "relative mx-auto w-full max-w-full"
    : cn("fixed left-1/2 z-50 max-w-[calc(100vw-16px)] -translate-x-1/2", preset.navClass, shell.navClassExtra)

  const showLive = embedded || !hideLive
  const dockInnerStyle = embedded
    ? ({ width: "100%", minHeight: shellH } as const)
    : ({ width: W, minHeight: shellH } as const)
  const pulseTop = preset.pulseTop

  const linearNavBtn = (item: SideNavItem) => (
    <NavBtn
      key={item.key}
      href={embedded ? "#" : item.href}
      Icon={item.icon}
      label={item.label}
      active={item.isActive(pathname)}
      badge={item.badge}
      preset={preset}
      showLabels={showLabels}
      navbarStyle={uiPrefs.navbarStyle}
      activeIndicator={uiPrefs.activeIndicator}
    />
  )

  if (uiPrefs.navbarStyle === "gradient") {
    return (
      <nav
        className={cn(navPositionClass, !embedded && visibilityClass)}
        style={embedded ? { width: "100%" } : { width: W, filter: navGlow }}
      >
        <div className="relative min-h-16 w-full overflow-hidden border-t border-[#2a2b35] bg-[#0a0b0f]">
          <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" aria-hidden>
            <defs>
              <linearGradient id="onbNavGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(0,229,255,0.15)" />
                <stop offset="50%" stopColor="rgba(168,85,247,0.15)" />
                <stop offset="100%" stopColor="rgba(249,115,22,0.15)" />
              </linearGradient>
            </defs>
            <rect width="100%" height="100%" fill="url(#onbNavGrad)" />
          </svg>
          <div className="relative flex items-stretch justify-between px-0.5 py-2">{linearItems.map(linearNavBtn)}</div>
        </div>
      </nav>
    )
  }

  if (uiPrefs.navbarStyle === "glass") {
    return (
      <nav
        className={cn(navPositionClass, !embedded && visibilityClass)}
        style={embedded ? { width: "100%" } : { width: W, filter: navGlow }}
      >
        <div className={cn("flex w-full justify-center py-2", embedded ? "px-0" : "px-3")}>
          <div className="flex w-full max-w-full items-stretch justify-between rounded-[20px] border border-white/10 bg-[rgba(20,22,30,0.85)] px-0.5 py-2.5">
            {linearItems.map(linearNavBtn)}
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav
      className={cn(navPositionClass, !embedded && visibilityClass)}
      style={{ width: embedded ? "100%" : W, filter: embedded ? undefined : navGlow }}
    >
      <div
        className="relative mx-auto overflow-visible"
        style={dockInnerStyle}
      >
        {shell.backdrop ? (
          <div
            className={cn("pointer-events-none absolute inset-x-0 bottom-0", shell.backdrop)}
            style={{
              top: barOffset,
              WebkitBackdropFilter: "blur(40px) saturate(180%)",
            }}
          />
        ) : null}

        <svg
          width={embedded ? "100%" : W}
          height={H}
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio={embedded ? "xMidYMax meet" : undefined}
          className="relative z-[1] block overflow-visible"
        >
          <defs>
            <linearGradient id="navGradStroke" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--primary)" />
              <stop offset="50%" stopColor="var(--secondary)" />
              <stop offset="100%" stopColor="var(--accent)" />
            </linearGradient>
            {visibility === "desktop" && (
              <linearGradient id="dockBorderGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(255,255,255,0)" />
                <stop offset="30%" stopColor="rgba(255,255,255,0.25)" />
                <stop offset="50%" stopColor="rgba(255,255,255,0.45)" />
                <stop offset="70%" stopColor="rgba(255,255,255,0.25)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0)" />
              </linearGradient>
            )}
          </defs>
          <g transform={`translate(0, ${barOffset})`}>
            <path d={PATH} fill={shell.pathFill} />
            <path d={PATH} fill="none" stroke={shell.pathStroke} strokeWidth="1" />
          </g>
        </svg>

        <style>{`
          @keyframes heartbeat {
            0%   { transform: scale(1); }
            14%  { transform: scale(${visibility === "desktop" ? 1.15 : 1.12}); }
            28%  { transform: scale(1); }
            42%  { transform: scale(${visibility === "desktop" ? 1.1 : 1.08}); }
            70%  { transform: scale(1); }
            100% { transform: scale(1); }
          }
          .pulse-hb { animation: heartbeat 1.4s ease-in-out infinite; }
        `}</style>

        <div
          className="absolute left-1/2 z-20 flex -translate-x-1/2 flex-col items-center pointer-events-none"
          style={{ top: pulseTop }}
        >
          {showLive ? (
            <span className={cn("mb-1 block whitespace-nowrap", preset.liveClass)}>
              LIVE CITY ACTIVE
            </span>
          ) : null}
          <Link
            href={embedded ? "#" : "/events"}
            className={cn(
              "pointer-events-auto flex flex-col items-center",
              visibility === "desktop" ? "gap-1.5" : "gap-0.5"
            )}
            aria-label="Eventos"
            tabIndex={embedded ? -1 : undefined}
          >
            <div
              className={cn(
                "pulse-hb flex items-center justify-center rounded-full border border-orange-500/20",
                isEventsActive && "ring-2 ring-primary/60",
                visibility === "desktop" && "mt-3"
              )}
              style={{ width: preset.pulse.outer, height: preset.pulse.outer }}
            >
              <div
                className="flex items-center justify-center rounded-full border border-orange-500/45 bg-black/30"
                style={{ width: preset.pulse.mid, height: preset.pulse.mid }}
              >
                <div
                  className={cn(
                    "flex items-center justify-center rounded-full border-[2.5px] border-orange-500 bg-gradient-to-br from-orange-500 to-red-600",
                    visibility === "desktop"
                      ? "shadow-[0_0_24px_rgba(249,115,22,0.8),0_0_48px_rgba(234,88,12,0.4)] drop-shadow-[0_0_12px_rgba(249,115,22,0.8)]"
                      : "shadow-[0_0_16px_rgba(249,115,22,0.65)]"
                  )}
                  style={{ width: preset.pulse.core, height: preset.pulse.core }}
                >
                  <Radio
                    className={
                      embedded
                        ? "h-3.5 w-3.5 text-white"
                        : visibility === "desktop"
                          ? "h-5 w-5 text-white"
                          : "h-4 w-4 text-white"
                    }
                    strokeWidth={2.5}
                  />
                </div>
              </div>
            </div>
            <span
              className={cn(
                preset.eventsLabelClass,
                isEventsActive ? "text-primary" : "text-slate-400"
              )}
            >
              EVENTS
            </span>
          </Link>
        </div>

        <div
          className="absolute inset-x-0 z-10 flex items-stretch"
          style={{
            top: navTop,
            height: navHeight,
            paddingLeft: preset.navPx,
            paddingRight: preset.navPx,
          }}
        >
          <div className="flex flex-1 items-stretch justify-evenly">
            {leftItems.map((item) => (
              <NavBtn
                key={item.key}
                href={embedded ? "#" : item.href}
                Icon={item.icon}
                label={item.label}
                active={item.isActive(pathname)}
                badge={item.badge}
                preset={preset}
                showLabels={showLabels}
                navbarStyle={uiPrefs.navbarStyle}
                activeIndicator={uiPrefs.activeIndicator}
              />
            ))}
          </div>

          <div className="shrink-0" style={{ width: CENTER_GAP }} aria-hidden />

          <div className="flex flex-1 items-stretch justify-evenly">
            {rightItems.map((item) =>
              item.avatar ? (
                preset.hoverNav ? (
                  <Link
                    key={item.key}
                    href={embedded ? "#" : item.href}
                    className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end px-1 pb-0.5"
                  >
                    <IconSlot preset={preset}>
                      {user?.profilePictureUrl ? (
                        <img
                          src={user.profilePictureUrl}
                          alt="Profile"
                          className={cn(
                            "rounded-full object-cover opacity-85 transition-[opacity,box-shadow] duration-200 group-hover:opacity-100 group-hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]",
                            profileActive && "ring-2 ring-primary"
                          )}
                          style={{
                            width: preset.avatarPx,
                            height: preset.avatarPx,
                            border: "2px solid rgba(255,255,255,0.3)",
                            boxShadow: "0 0 12px rgba(255,255,255,0.15)",
                          }}
                        />
                      ) : (
                        <Avatar
                          className={cn(profileActive && "ring-2 ring-primary")}
                          style={{ width: preset.avatarPx, height: preset.avatarPx }}
                        >
                          <AvatarFallback className="bg-primary/20 text-primary text-sm font-bold">
                            {user?.nombres?.[0]?.toUpperCase() || <User className="h-4 w-4" />}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </IconSlot>
                    <LabelSlot preset={preset}>
                      <span className="text-center text-[10px] font-bold uppercase leading-none tracking-[0.2em] text-slate-400">
                        PROFILE
                      </span>
                      {profileSub ? (
                        <span className="text-center text-[9px] font-medium leading-none text-slate-500">
                          {profileSub}
                        </span>
                      ) : null}
                    </LabelSlot>
                  </Link>
                ) : (
                  <Link
                    key={item.key}
                    href={embedded ? "#" : item.href}
                    className={cn(
                      "flex h-full min-w-0 flex-1 flex-col items-center justify-end px-0.5 pb-0.5",
                      profileActive ? "text-white" : "text-gray-500"
                    )}
                  >
                    <IconSlot preset={preset}>
                      <div className={cn("relative", profileActive && "rounded-full ring-2 ring-primary")}>
                        <Avatar style={{ width: preset.avatarPx, height: preset.avatarPx }}>
                          <AvatarImage src={user?.profilePictureUrl} alt={user?.nombres} className="object-cover" />
                          <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                            {user?.nombres?.[0]?.toUpperCase() || <User className="h-3 w-3" />}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    </IconSlot>
                    <LabelSlot preset={preset}>
                      <span className={cn("w-full truncate text-center", preset.labelClass)}>
                        {item.label}
                      </span>
                    </LabelSlot>
                  </Link>
                )
              ) : (
                <NavBtn
                  key={item.key}
                  href={embedded ? "#" : item.href}
                  Icon={item.icon}
                  label={item.label}
                  active={item.isActive(pathname)}
                  preset={preset}
                  showLabels={showLabels}
                  navbarStyle={uiPrefs.navbarStyle}
                  activeIndicator={uiPrefs.activeIndicator}
                />
              )
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export function BottomNav() {
  return <SparkdNavBar visibility="mobile" />
}
