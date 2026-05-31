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
import {
  borderClassForCategory,
  fallbackPhotoForCategory,
  getInitialPhotosForSlots,
  pickNextInCategory,
  WELCOME_AMBIENT_SLOTS,
  type WelcomeAmbientPhoto,
  type WelcomeAmbientSlot,
} from "@/lib/welcome-ambient-photos"

type AmbientRegistry = {
  register: (slotId: number, photoId: string) => void
  getUsedIds: () => Set<string>
}

const AmbientRegistryContext = createContext<AmbientRegistry | null>(null)

function AmbientRegistryProvider({ children }: { children: ReactNode }) {
  const bySlot = useRef<Map<number, string>>(new Map())

  const register = useCallback((slotId: number, photoId: string) => {
    bySlot.current.set(slotId, photoId)
  }, [])

  const getUsedIds = useCallback(() => new Set(bySlot.current.values()), [])

  const value = useMemo(() => ({ register, getUsedIds }), [register, getUsedIds])

  return (
    <AmbientRegistryContext.Provider value={value}>{children}</AmbientRegistryContext.Provider>
  )
}

function randomBetween(min: number, max: number) {
  return min + Math.floor(Math.random() * (max - min + 1))
}

function AmbientSlotCard({
  slot,
  initialPhoto,
}: {
  slot: WelcomeAmbientSlot
  initialPhoto: WelcomeAmbientPhoto
}) {
  const registry = useContext(AmbientRegistryContext)
  const [photo, setPhoto] = useState(initialPhoto)
  const [visible, setVisible] = useState(false)
  const [broken, setBroken] = useState(false)

  const displayPhoto = broken ? fallbackPhotoForCategory(slot.category) : photo

  useEffect(() => {
    registry?.register(slot.id, displayPhoto.id)
  }, [registry, slot.id, displayPhoto.id])

  useEffect(() => {
    setBroken(false)
  }, [photo.id])

  useEffect(() => {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches

    if (reduced) {
      setVisible(true)
      return
    }

    let hideTimer = 0
    let swapTimer = 0
    let cancelled = false

    const cycle = () => {
      if (cancelled) return
      setVisible(true)
      hideTimer = window.setTimeout(() => {
        if (cancelled) return
        setVisible(false)
        swapTimer = window.setTimeout(() => {
          if (cancelled) return
          const used = registry?.getUsedIds() ?? new Set<string>()
          used.delete(photo.id)
          const next = pickNextInCategory(slot.category, used)
          setPhoto(next)
          setBroken(false)
          setVisible(true)
          cycle()
        }, 900)
      }, randomBetween(3200, 5600))
    }

    const startTimer = window.setTimeout(cycle, randomBetween(300, 2000) + slot.id * 420)

    return () => {
      cancelled = true
      window.clearTimeout(startTimer)
      window.clearTimeout(hideTimer)
      window.clearTimeout(swapTimer)
    }
  }, [registry, slot.category, slot.id, photo.id])

  const posStyle = useMemo(() => {
    const base: React.CSSProperties = {
      top: slot.top,
      width: slot.width,
      height: slot.height,
      transform: `rotate(${slot.rotate}deg)`,
    }
    if (slot.left !== undefined) base.left = slot.left
    if (slot.right !== undefined) base.right = slot.right
    return base
  }, [slot])

  const desktopOnly = slot.desktopOnly ? "hidden md:block" : "block"

  return (
    <div
      className={`pointer-events-none absolute z-[2] ${desktopOnly}`}
      style={posStyle}
      aria-hidden
    >
      <div
        className={`relative h-full w-full overflow-hidden rounded-2xl border bg-black transition-all duration-[900ms] ease-in-out ${borderClassForCategory(slot.category)} ${
          visible ? "opacity-[0.48] scale-100" : "opacity-0 scale-[0.94]"
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={displayPhoto.id}
          src={displayPhoto.url}
          alt=""
          className="absolute inset-0 h-[116%] w-[116%] max-w-none -translate-x-[8%] -translate-y-[8%] object-cover object-center"
          loading="lazy"
          decoding="async"
          draggable={false}
          onError={() => setBroken(true)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-primary/10" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-secondary/15" />
        <span className="absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white/75">
          {displayPhoto.label}
        </span>
      </div>
    </div>
  )
}

export function WelcomeAmbientPhotos() {
  const initialMap = useMemo(() => getInitialPhotosForSlots(), [])

  return (
    <AmbientRegistryProvider>
      <div className="pointer-events-none absolute inset-0 z-[2] overflow-visible" aria-hidden>
        {WELCOME_AMBIENT_SLOTS.map((slot) => (
          <AmbientSlotCard
            key={slot.id}
            slot={slot}
            initialPhoto={initialMap.get(slot.id)!}
          />
        ))}
        <div className="absolute inset-0 z-[3] bg-[radial-gradient(ellipse_at_center,transparent_0%,transparent_38%,rgba(0,0,0,0.5)_100%)]" />
      </div>
    </AmbientRegistryProvider>
  )
}
