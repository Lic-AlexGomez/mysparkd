import type { Group } from "@/lib/types"

/** Colección de fotos placeholder cuando el grupo no tiene portada en servidor. */
export type GroupCoverFallbackStyle = "MOMENTS" | "AURA" | "NIGHT" | "MINIMAL"

export const GROUP_COVER_FALLBACK_STORAGE_KEY = "sparkd_groups_fallback_cover_style"

const FALLBACK_SETS: Record<GroupCoverFallbackStyle, readonly string[]> = {
  MOMENTS: [
    "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=70",
    "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1200&q=70",
    "https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1200&q=70",
    "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=70",
    "https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=1200&q=70",
    "https://images.unsplash.com/photo-1472653431158-6364773b2a56?auto=format&fit=crop&w=1200&q=70",
  ],
  AURA: [
    "https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=1200&q=70",
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=70",
    "https://images.unsplash.com/photo-1558591710-4b4a40ae0b04?auto=format&fit=crop&w=1200&q=70",
    "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&w=1200&q=70",
    "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&w=1200&q=70",
    "https://images.unsplash.com/photo-1599729557055-d782cba20deb?auto=format&fit=crop&w=1200&q=70",
  ],
  NIGHT: [
    "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=70",
    "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1200&q=70",
    "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=70",
    "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=70",
    "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=1200&q=70",
    "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1200&q=70",
  ],
  MINIMAL: [
    "https://images.unsplash.com/photo-1557683311-eac922347766?auto=format&fit=crop&w=1200&q=70",
    "https://images.unsplash.com/photo-1557682250-33bd709c1e5f?auto=format&fit=crop&w=1200&q=70",
    "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=70",
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=70",
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=70",
    "https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?auto=format&fit=crop&w=1200&q=70",
  ],
}

export function hashString(value: string): number {
  let h = 0
  for (let i = 0; i < value.length; i++) h = (h * 31 + value.charCodeAt(i)) >>> 0
  return h
}

export function getStoredFallbackStyle(): GroupCoverFallbackStyle {
  if (typeof window === "undefined") return "MOMENTS"
  const v = localStorage.getItem(GROUP_COVER_FALLBACK_STORAGE_KEY)
  if (v === "MOMENTS" || v === "AURA" || v === "NIGHT" || v === "MINIMAL") return v
  return "MOMENTS"
}

/** URL de portada: servidor si existe; si no, placeholder según estilo. */
export function resolveGroupCoverUrl(
  group: Pick<Group, "id" | "name" | "coverPhoto" | "coverPhotoUrl">,
  style: GroupCoverFallbackStyle = getStoredFallbackStyle()
): string {
  const server = group.coverPhotoUrl || group.coverPhoto
  if (server) return server
  const photos = FALLBACK_SETS[style]
  const idx = hashString(group.id || group.name || "group") % photos.length
  return photos[idx]
}
