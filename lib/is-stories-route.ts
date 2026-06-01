/** True when the current route is the full-screen stories viewer. */
export function isStoriesRoute(pathname: string | null | undefined): boolean {
  if (!pathname) return false
  const path = pathname.split("?")[0].split("#")[0]
  return (
    path === "/stories" ||
    path.endsWith("/stories") ||
    path.includes("/stories/")
  )
}
