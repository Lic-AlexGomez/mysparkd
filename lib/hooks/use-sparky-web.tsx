"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import {
  DEFAULT_HELP_ASSISTANT_SETTINGS,
  DEFAULT_SPARKY_AI_SETTINGS,
  normalizeHelpAssistantSettings,
  resolveHelpRouteKey,
  type HelpAssistantSettings,
  type HelpRouteKey,
  type SparkyMode,
} from "@/lib/help-assistant"
import { storage, STORAGE_KEYS } from "@/lib/storage"
import {
  getSparkyInlineTapConfig,
  SPARKY_INLINE_ERROR,
  SPARKY_INLINE_LOADING,
  SPARKY_LONG_PRESS_HINT,
} from "@/lib/sparky-inline-actions"
import { routeToContextAnchor } from "@/lib/sparky-anchors"
import type { SparkyAnchor } from "@/lib/sparky-motion"
import { getSparkyContextActions, findContextAction } from "@/lib/sparky-context-actions"
import { getSparkyReaction, type SparkyReactionEvent } from "@/lib/sparky-reactions"
import { getSparkBond, addBondPoints } from "@/lib/sparky-bond"
import { getEngagementTier } from "@/lib/sparky-engagement"
import { resolveSparkyMood, type SparkyCharacterMood } from "@/lib/sparky-mood"
import {
  buildSparkyTips,
  type HelpAssistantContext,
} from "@/lib/help-assistant"
import {
  resolveDiscoverConfig,
  resolveEventsConfig,
  resolveFeedConfig,
  resolveLayoutFlags,
  resolveProfileConfig,
} from "@/lib/layout-flags"
import { DEFAULT_UI_PREFERENCES } from "@/lib/ui-preferences"
import { useVisualAppearance } from "@/components/theme/visual-appearance-provider"
import {
  generateAppearanceRecommendation,
  generateConversationReplySuggestions,
  generateDatingActionTip,
  generateEventRecommendation,
  generateIcebreaker,
  generateMatchExplanation,
  generateProfileSuggestions,
} from "@/lib/sparky-ai"
import {
  EMPTY_SPARKY_MEMORY,
  loadSparkyMemory,
  saveSparkyMemory,
  type SparkyMemory,
} from "@/lib/sparky-memory"
import { recordSparkyIgnore as applyIgnore, recordSparkyTouch as applyTouch } from "@/lib/sparky-engagement"
import type { SparkyAppearancePatch } from "@/lib/sparky-appearance-local"
import type { UserProfile } from "@/lib/types"

export type SparkyInlineActionItem = {
  id: string
  label: string
  variant?: "primary" | "secondary"
}

export type SparkyInlineBubbleState = {
  visible: boolean
  message: string
  loading: boolean
  actions: SparkyInlineActionItem[]
  hint?: string
  anchor?: SparkyAnchor
}

export type SparkyWebContextValue = {
  loaded: boolean
  settings: HelpAssistantSettings
  routeKey: HelpRouteKey | null
  sparkyMood: SparkyCharacterMood
  bondLabel: string
  bondLevel: number
  bondProgress: number
  inlineBubble: SparkyInlineBubbleState
  pocketOpen: boolean
  anchor: SparkyAnchor
  showFab: boolean
  onSparkyTap: () => void
  onSparkyLongPress: () => void
  dismissInlineBubble: (recordIgnore?: boolean) => void
  runInlineAction: (actionId: string) => Promise<void>
  openPocket: () => void
  closePocket: () => void
  contextActions: ReturnType<typeof getSparkyContextActions>
  patchSettings: (patch: Partial<HelpAssistantSettings>) => void
  setSparkyMode: (mode: SparkyMode) => void
  toggleEnabled: () => void
  setAutoShow: (v: boolean) => void
  fireReaction: (event: SparkyReactionEvent) => void
  registerDiscoverTarget: (target: Partial<UserProfile> | null) => void
  applyAppearancePatch: (patch: SparkyAppearancePatch | null) => void
}

const SparkyWebContext = createContext<SparkyWebContextValue | null>(null)

async function loadSettings(): Promise<HelpAssistantSettings> {
  const raw = await storage.getItem(STORAGE_KEYS.helpAssistantSettings)
  if (!raw) return { ...DEFAULT_HELP_ASSISTANT_SETTINGS }
  try {
    return normalizeHelpAssistantSettings(JSON.parse(raw))
  } catch {
    return { ...DEFAULT_HELP_ASSISTANT_SETTINGS }
  }
}

export function SparkyWebProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { user } = useAuth()
  const { visualAppearanceId } = useVisualAppearance()
  const [settings, setSettings] = useState<HelpAssistantSettings>(DEFAULT_HELP_ASSISTANT_SETTINGS)
  const [loaded, setLoaded] = useState(false)
  const [sparkyMemory, setSparkyMemory] = useState<SparkyMemory>({ ...EMPTY_SPARKY_MEMORY })
  const [inlineBubble, setInlineBubble] = useState<SparkyInlineBubbleState>({
    visible: false,
    message: "",
    loading: false,
    actions: [],
  })
  const [pocketOpen, setPocketOpen] = useState(false)
  const [anchor, setAnchor] = useState<SparkyAnchor>("bottomRight")
  const sparkyTapCount = useRef(0)
  const pendingTarget = useRef<Partial<UserProfile> | null>(null)
  const appearancePatch = useRef<SparkyAppearancePatch | null>(null)

  const routeKey = useMemo(() => resolveHelpRouteKey(pathname), [pathname])

  const helpContext = useMemo((): HelpAssistantContext => {
    const ui = DEFAULT_UI_PREFERENCES
    const layoutFlags = resolveLayoutFlags(visualAppearanceId, ui)
    return {
      pathname,
      settingsSection: null,
      visualAppearance: visualAppearanceId,
      layoutFlags,
      feedConfig: resolveFeedConfig(visualAppearanceId, ui),
      eventsConfig: resolveEventsConfig(visualAppearanceId, ui),
      profileConfig: resolveProfileConfig(visualAppearanceId, ui),
      discoverConfig: resolveDiscoverConfig(visualAppearanceId, ui),
      experienceObjective: "both",
      isBothMode: true,
      isSocialMode: false,
      isDatingNav: pathname.startsWith("/swipes"),
    }
  }, [pathname, visualAppearanceId])

  useEffect(() => {
    void (async () => {
      const [s, m] = await Promise.all([loadSettings(), loadSparkyMemory()])
      setSettings(s)
      setSparkyMemory(m)
      setLoaded(true)
    })()
  }, [])

  const persistSettings = useCallback(async (next: HelpAssistantSettings) => {
    setSettings(next)
    await storage.setItem(STORAGE_KEYS.helpAssistantSettings, JSON.stringify(next))
  }, [])

  const patchSettings = useCallback(
    (patch: Partial<HelpAssistantSettings>) => {
      void persistSettings({ ...settings, ...patch })
    },
    [persistSettings, settings]
  )

  const updateMemory = useCallback((next: SparkyMemory) => {
    setSparkyMemory(next)
    if (settings.sparkyMemoryEnabled) void saveSparkyMemory(next)
  }, [settings.sparkyMemoryEnabled])

  const touchSparky = useCallback(() => {
    updateMemory(applyTouch(sparkyMemory))
  }, [sparkyMemory, updateMemory])

  const recordIgnore = useCallback(() => {
    updateMemory(applyIgnore(sparkyMemory))
  }, [sparkyMemory, updateMemory])

  const dismissInlineBubble = useCallback((recordIgnoreFlag = false) => {
    setInlineBubble({ visible: false, message: "", loading: false, actions: [] })
    setAnchor("bottomRight")
    if (recordIgnoreFlag) recordIgnore()
  }, [recordIgnore])

  const openPocket = useCallback(() => {
    touchSparky()
    setInlineBubble((b) => ({ ...b, visible: false }))
    setPocketOpen(true)
  }, [touchSparky])

  const closePocket = useCallback(() => setPocketOpen(false), [])

  const onSparkyLongPress = useCallback(() => openPocket(), [openPocket])

  const onSparkyTap = useCallback(() => {
    touchSparky()
    sparkyTapCount.current += 1
    const config = getSparkyInlineTapConfig(routeKey)
    const nextAnchor = config.anchor
    setAnchor(nextAnchor)
    setInlineBubble({
      visible: true,
      message: config.message,
      loading: false,
      actions: config.actions.map((a) => ({
        id: a.id,
        label: a.label,
        variant: a.variant,
      })),
      hint: sparkyTapCount.current >= 3 ? SPARKY_LONG_PRESS_HINT : undefined,
      anchor: nextAnchor,
    })
  }, [routeKey, touchSparky])

  const viewerProfile = useMemo((): Partial<UserProfile> => {
    if (!user) return {}
    return {
      userId: user.userId,
      username: user.username,
      nombres: user.nombres,
      bio: user.bio,
      interests: user.interests,
      photos: user.photos,
      profileCompleted: user.profileCompleted,
    }
  }, [user])

  const runInlineAction = useCallback(
    async (actionId: string) => {
      if (actionId === "close") {
        dismissInlineBubble()
        return
      }
      if (actionId === "apply-look") {
        if (appearancePatch.current) {
          window.dispatchEvent(
            new CustomEvent("sparky-apply-appearance", { detail: appearancePatch.current })
          )
        }
        dismissInlineBubble()
        return
      }

      touchSparky()
      setInlineBubble((b) => ({
        ...b,
        loading: true,
        message: SPARKY_INLINE_LOADING,
        actions: [],
      }))

      const target = pendingTarget.current ?? {}
      const ai = settings.sparkyAI ?? DEFAULT_SPARKY_AI_SETTINGS

      try {
        let message = ""
        let actions: SparkyInlineActionItem[] = [{ id: "close", label: "Cerrar", variant: "secondary" }]

        if (actionId === "vibe") {
          const r = await generateMatchExplanation(viewerProfile, target, ai)
          message = r.suggestions[0] ? `Yo veo: ${r.suggestions[0]}` : "Buena vibra por aquí."
          actions = [
            { id: "phrase", label: "Dame frase", variant: "primary" },
            { id: "close", label: "Cerrar", variant: "secondary" },
          ]
        } else if (actionId === "phrase") {
          const r = await generateIcebreaker(target.username ?? target.nombres, viewerProfile, target, ai)
          message = r.suggestions[0] ?? "Prueba con algo simple y cercano."
          actions = [{ id: "close", label: "Listo ✓", variant: "primary" }]
        } else if (actionId === "spark-tip") {
          const r = await generateDatingActionTip(viewerProfile, target, ai)
          message = r.suggestions[0] ?? "Si te llama, Spark; si dudas, like tranqui."
          actions = [
            { id: "phrase", label: "Dame frase", variant: "primary" },
            { id: "close", label: "Cerrar", variant: "secondary" },
          ]
        } else if (actionId === "which-event" || actionId === "event") {
          const r = await generateEventRecommendation(
            { title: "Eventos cerca", category: "OTHER" },
            Array.isArray(viewerProfile.interests)
              ? viewerProfile.interests.map((i) => (typeof i === "string" ? i : String(i)))
              : [],
            ai
          )
          message = r.suggestions[0] ?? "Hay planes sociales sin mucha presión cerca."
          actions = [{ id: "close", label: "Suena bien", variant: "primary" }]
        } else if (actionId === "shine" || actionId === "bio") {
          const r = await generateProfileSuggestions(viewerProfile, ai)
          message = r.suggestions[0] ?? "Tu perfil puede brillar con una bio más concreta."
          actions = [{ id: "close", label: "Lo tengo", variant: "primary" }]
        } else if (actionId === "pick-look" || actionId === "more-neon" || actionId === "elegant") {
          const r = await generateAppearanceRecommendation(helpContext, ai)
          appearancePatch.current = r.appearancePatch ?? null
          message = r.suggestions[0] ?? "Yo probaría un look con más personalidad."
          actions = r.appearancePatch
            ? [
                { id: "apply-look", label: "Aplicar", variant: "primary" },
                { id: "pick-look", label: "Otra idea", variant: "secondary" },
              ]
            : [{ id: "close", label: "Ok", variant: "secondary" }]
        } else if (actionId === "screen") {
          const tips = buildSparkyTips(helpContext)
          message = tips[0] ?? "Explora con calma — no hace falta hacer todo hoy."
          actions = [{ id: "close", label: "Gracias", variant: "primary" }]
        } else if (actionId === "reply" || actionId === "casual") {
          const r = await generateConversationReplySuggestions(undefined, undefined, ai, {
            useContext: settings.sparkyAI?.useConversationContext ?? false,
          })
          message =
            actionId === "casual"
              ? (r.suggestions[1] ?? r.suggestions[0] ?? "Algo corto y relajado.")
              : (r.suggestions[0] ?? "Algo corto y amable suele ir bien.")
          actions = [{ id: "close", label: "Gracias", variant: "primary" }]
        } else if (actionId === "explain-event") {
          const tips = buildSparkyTips(helpContext)
          message =
            tips.find((t) => t.toLowerCase().includes("event")) ??
            "Los eventos son planes reales — RSVP y aparece con calma."
          actions = [{ id: "which-event", label: "Recomiéndame uno", variant: "primary" }]
        } else {
          const action = findContextAction(routeKey, actionId)
          if (action) {
            dismissInlineBubble()
            openPocket()
          }
          return
        }

        setInlineBubble({
          visible: true,
          message,
          loading: false,
          actions,
          hint: sparkyTapCount.current >= 2 ? SPARKY_LONG_PRESS_HINT : undefined,
          anchor: routeToContextAnchor(routeKey),
        })
        setAnchor(routeToContextAnchor(routeKey))
      } catch {
        setInlineBubble({
          visible: true,
          message: SPARKY_INLINE_ERROR,
          loading: false,
          actions: [{ id: "close", label: "Ok", variant: "secondary" }],
        })
      }
    },
    [
      dismissInlineBubble,
      helpContext,
      openPocket,
      routeKey,
      settings.sparkyAI,
      touchSparky,
      viewerProfile,
    ]
  )

  const fireReaction = useCallback(
    (event: SparkyReactionEvent) => {
      const reaction = getSparkyReaction(event)
      if (reaction.phrase && !reaction.silent) {
        const a = routeToContextAnchor(routeKey)
        setAnchor(a)
        setInlineBubble({
          visible: true,
          message: reaction.phrase,
          loading: false,
          actions: [{ id: "close", label: "Ok", variant: "secondary" }],
          anchor: a,
        })
      }
      if (reaction.phrase) {
        updateMemory(addBondPoints(sparkyMemory, 1))
      }
    },
    [routeKey, sparkyMemory, updateMemory]
  )

  const bond = useMemo(() => getSparkBond(sparkyMemory), [sparkyMemory])

  const sparkyMood = useMemo(
    () =>
      resolveSparkyMood({
        settings,
        routeKey,
        engagementTier: getEngagementTier(sparkyMemory),
        profileCompleted: user?.profileCompleted,
      }),
    [settings, routeKey, sparkyMemory, user?.profileCompleted]
  )

  const showFab =
    loaded &&
    settings.enabled &&
    settings.sparkyMode !== "quiet" &&
    !pathname.startsWith("/onboarding")

  const value = useMemo(
    (): SparkyWebContextValue => ({
      loaded,
      settings,
      routeKey,
      sparkyMood,
      bondLabel: bond.label,
      bondLevel: bond.level,
      bondProgress: bond.progress,
      inlineBubble,
      pocketOpen,
      anchor,
      showFab,
      onSparkyTap,
      onSparkyLongPress,
      dismissInlineBubble,
      runInlineAction,
      openPocket,
      closePocket,
      contextActions: getSparkyContextActions(routeKey),
      patchSettings,
      setSparkyMode: (mode) => patchSettings({ sparkyMode: mode }),
      toggleEnabled: () => patchSettings({ enabled: !settings.enabled }),
      setAutoShow: (v) => patchSettings({ autoShow: v }),
      fireReaction,
      registerDiscoverTarget: (t) => {
        pendingTarget.current = t
      },
      applyAppearancePatch: (p) => {
        appearancePatch.current = p
      },
    }),
    [
      loaded,
      settings,
      routeKey,
      sparkyMood,
      bond,
      inlineBubble,
      pocketOpen,
      anchor,
      showFab,
      onSparkyTap,
      onSparkyLongPress,
      dismissInlineBubble,
      runInlineAction,
      openPocket,
      closePocket,
      patchSettings,
      fireReaction,
    ]
  )

  return <SparkyWebContext.Provider value={value}>{children}</SparkyWebContext.Provider>
}

export function useSparkyWeb() {
  const ctx = useContext(SparkyWebContext)
  if (!ctx) throw new Error("useSparkyWeb must be used within SparkyWebProvider")
  return ctx
}

export function useSparkyWebOptional() {
  return useContext(SparkyWebContext)
}
