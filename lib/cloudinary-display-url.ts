type StoryDisplayOpts = {
  width: number
  height: number
  pixelRatio?: number
  isVideo?: boolean
}

const MAX_EDGE = 2560

/**
 * Cloudinary delivery URL sized for full-screen story viewing (sharp on retina).
 */
export function cloudinaryStoryDisplayUrl(
  url: string | undefined | null,
  opts: StoryDisplayOpts
): string {
  if (!url) return ""
  if (!url.includes("res.cloudinary.com") || !url.includes("/upload/")) {
    return url
  }

  const dpr = Math.min(opts.pixelRatio ?? 2, 3)
  const w = Math.min(MAX_EDGE, Math.ceil(opts.width * dpr))
  const h = Math.min(MAX_EDGE, Math.ceil(opts.height * dpr))

  const transform = opts.isVideo
    ? `f_auto,q_auto:good,w_${w},h_${h},c_fit`
    : `f_auto,q_auto:best,w_${w},h_${h},c_fit`

  return insertCloudinaryTransform(url, transform)
}

function insertCloudinaryTransform(url: string, transform: string): string {
  const marker = "/upload/"
  const idx = url.indexOf(marker)
  if (idx === -1) return url

  const after = url.slice(idx + marker.length)
  const first = after.split("/")[0] ?? ""
  if (first.includes(",") || first.includes("_")) {
    return url
  }

  return `${url.slice(0, idx + marker.length)}${transform}/${after}`
}
