export type FollowButtonState = {
  following: boolean
  requestPending: boolean
  followedBy: boolean
  followBack?: boolean
}

export function shouldShowFollowsYouHint(state: FollowButtonState): boolean {
  if (state.following || state.requestPending) return false
  return Boolean(state.followedBy || state.followBack)
}

export function getFollowButtonLabel(
  state: FollowButtonState,
  te: (es: string, en: string) => string,
  opts?: { privateAccount?: boolean; theyFollowProfileOwner?: boolean }
): string {
  if (state.following) return te("Siguiendo", "Following")
  if (state.requestPending) return te("Solicitado", "Requested")
  if (state.followedBy || state.followBack || opts?.theyFollowProfileOwner) {
    return te("Seguir de vuelta", "Follow back")
  }
  if (opts?.privateAccount) return te("Solicitar", "Request")
  return te("Seguir", "Follow")
}
