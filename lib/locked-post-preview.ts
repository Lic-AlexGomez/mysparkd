/** Preview para posts premium bloqueados (paridad con LockedPostPreviewUtil del backend). */
export function teaserFromBody(body: string | null | undefined): string {
  const t = (body ?? "").trim().replace(/\s+/g, " ")
  if (!t) return "Contenido exclusivo para suscriptores Premium"
  return t.length <= 220 ? t : `${t.slice(0, 220)}…`
}

export function blurredMediaUrl(url: string | null | undefined): string | null {
  if (!url?.trim()) return null
  if (url.includes("e_blur:")) return url
  if (url.includes("res.cloudinary.com") && url.includes("/upload/")) {
    const transform = "e_blur:1600,q_12,w_640"
    const withTransform = url.includes("/video/upload/")
      ? `so_0,${transform}`
      : transform
    return url.replace("/upload/", `/upload/${withTransform}/`)
  }
  return url
}

export function lockedPreviewFile(
  file: string | null,
  locked: boolean,
  unlocked: boolean
): string | null {
  if (!locked || unlocked || !file) return file
  return blurredMediaUrl(file) ?? file
}

export function applyLockedPostFields<
  T extends {
    body?: string | null
    file?: string | null
    message?: string | null
    locked?: boolean
    unlocked?: boolean
    media?: { mediaUrl?: string } | null
  },
>(post: T): T {
  const locked = Boolean(post.locked)
  const unlocked =
    post.unlocked !== undefined && post.unlocked !== null
      ? Boolean(post.unlocked)
      : !locked
  if (!locked || unlocked) return post

  const rawBody = (post.body ?? "").trim()
  const rawFile =
    post.file ||
    (typeof post.media === "object" && post.media?.mediaUrl
      ? post.media.mediaUrl
      : null) ||
    null
  const file = lockedPreviewFile(rawFile, true, false)
  const message =
    (post.message && post.message.trim()) || teaserFromBody(rawBody)

  return {
    ...post,
    locked: true,
    unlocked: false,
    body: "",
    file,
    message,
  }
}
