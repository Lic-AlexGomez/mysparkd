/** Perfil propio (tabs / edición). Perfil ajeno: `/profile/{id}`. */
export const OWN_PROFILE_PATH = "/profile"

export function profileHref(
  targetUserId: string | null | undefined,
  viewerUserId?: string | null
): string {
  const id = String(targetUserId ?? "").trim()
  if (!id) return OWN_PROFILE_PATH
  const viewer = String(viewerUserId ?? "").trim()
  if (viewer && id === viewer) return OWN_PROFILE_PATH
  return `/profile/${encodeURIComponent(id)}`
}

export function isOwnProfile(
  targetUserId: string | null | undefined,
  viewerUserId?: string | null
): boolean {
  const id = String(targetUserId ?? "").trim()
  const viewer = String(viewerUserId ?? "").trim()
  return Boolean(id && viewer && id === viewer)
}
