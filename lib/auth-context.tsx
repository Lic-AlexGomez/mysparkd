"use client"

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react"
import { api } from "@/lib/api"
import { normalizeProfilePosts } from "@/lib/normalize-profile-posts"
import type {
  User,
  UserProfile,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
} from "@/lib/types"

/** Si el login envía `accountType` y `/api/profile/me` aún no lo refleja, se fusiona hasta el próximo GET. */
export const SPARKD_LOGIN_ACCOUNT_TYPE_KEY = "sparkd_login_account_type"

export function mergeProfileWithStashedLoginAccountType(profile: UserProfile): UserProfile {
  if (typeof window === "undefined") return profile
  const stash = localStorage.getItem(SPARKD_LOGIN_ACCOUNT_TYPE_KEY)
  if (stash && !profile.accountType) {
    return { ...profile, accountType: stash }
  }
  return profile
}

export function stashLoginAccountType(accountType: string | undefined) {
  if (typeof window === "undefined") return
  if (accountType) {
    localStorage.setItem(SPARKD_LOGIN_ACCOUNT_TYPE_KEY, accountType)
  }
}

export function clearStashedLoginAccountTypeIfSynced(profile: UserProfile) {
  if (typeof window === "undefined") return
  if (profile.accountType) {
    localStorage.removeItem(SPARKD_LOGIN_ACCOUNT_TYPE_KEY)
  }
}

/** Normaliza reactions de un post crudo del backend al formato que espera PostCard */
function normalizePostFromProfile(post: any): any {
  const reactionsObj: Record<string, { type: string; count: number; userReacted: boolean }> = {}
  if (Array.isArray(post?.reactions)) {
    post.reactions.forEach((r: any) => {
      reactionsObj[r.reaction] = {
        type: r.reaction,
        count: r.count,
        userReacted: post.myReaction === r.reaction,
      }
    })
  }
  return {
    ...post,
    body: post.body ?? null,
    userId: post.userId ? String(post.userId) : '',
    userReaction: post.myReaction ?? null,
    reactions: Object.keys(reactionsObj).length > 0 ? reactionsObj : (post.reactions || {}),
  }
}

/** Alinea nombres del DTO Java (snake_case) con el cliente. */
function normalizeProfileFromApi(profile: UserProfile): UserProfile {
  const r = profile as UserProfile & {
    recovery_email?: string | null
    total_posts?: number
    preferred_language?: string
  }
  // Initialize next before using it
  let next: UserProfile = profile
  if (Array.isArray(next.posts)) {
    next = { ...next, posts: next.posts.map(normalizePostFromProfile) }
  }

  const recovery = profile.recoveryEmail ?? r.recovery_email

  const totalPosts =
    typeof profile.totalPosts === "number"
      ? profile.totalPosts
      : typeof r.total_posts === "number"
        ? r.total_posts
        : undefined
  if (totalPosts !== undefined && totalPosts !== profile.totalPosts) {
    next = { ...next, totalPosts }
  } else if (typeof next.totalPosts !== "number") {
    const fallback = Array.isArray(profile.posts) ? profile.posts.length : 0
    next = { ...next, totalPosts: fallback }
  }

  const preferredLanguage =
    profile.preferredLanguage ?? r.preferred_language ?? undefined
  if (
    preferredLanguage !== undefined &&
    preferredLanguage !== profile.preferredLanguage
  ) {
    next = { ...next, preferredLanguage }
  }

  if (recovery === undefined || recovery === null) {
    next = { ...next, posts: normalizeProfilePosts(next.posts) }
    return next
  }
  if (recovery === profile.recoveryEmail) {
    return { ...next, posts: normalizeProfilePosts(next.posts) }
  }
  return {
    ...next,
    recoveryEmail: recovery,
    posts: normalizeProfilePosts(next.posts),
  }
}

interface AuthContextType {
  token: string | null
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (data: LoginRequest) => Promise<void>
  loginWithGoogle: (idToken: string) => Promise<void>
  register: (data: RegisterRequest) => Promise<RegisterResponse>
  logout: () => void
  refreshProfile: () => Promise<void>
  updateUser: (patch: Partial<UserProfile>) => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchProfile = useCallback(async () => {
    try {
      let profile = await api.get<UserProfile>("/api/profile/me")
      profile = normalizeProfileFromApi(profile)
      profile = mergeProfileWithStashedLoginAccountType(profile)
      clearStashedLoginAccountTypeIfSynced(profile)
      setUser(profile)
      localStorage.setItem("sparkd_user", JSON.stringify(profile))
    } catch (error) {
      const savedUser = localStorage.getItem("sparkd_user")
      if (savedUser) {
        let parsed = normalizeProfileFromApi(
          JSON.parse(savedUser) as UserProfile
        )
        parsed = mergeProfileWithStashedLoginAccountType(parsed)
        setUser(parsed)
        localStorage.setItem("sparkd_user", JSON.stringify(parsed))
      } else {
        setUser(null)
      }
    }
  }, [])

  useEffect(() => {
    const storedToken = localStorage.getItem("sparkd_token")
    const storedUser = localStorage.getItem("sparkd_user")

    if (!storedToken) {
      setIsLoading(false)
      return
    }

    setToken(storedToken)
    if (storedUser) {
      try {
        let u = normalizeProfileFromApi(JSON.parse(storedUser) as UserProfile)
        u = mergeProfileWithStashedLoginAccountType(u)
        setUser(u)
      } catch {
        // si el cache está corrupto, lo ignora y sigue a refresh remoto
      }
    }

    // Mostrar UI inmediatamente y refrescar perfil en segundo plano.
    setIsLoading(false)
    void fetchProfile()
  }, [fetchProfile])

  const login = async (data: LoginRequest) => {
    const response = await api.post<LoginResponse>("/auth/login", data)
    localStorage.setItem("sparkd_token", response.token)
    localStorage.setItem("sparkd_username", data.username)
    stashLoginAccountType(response.accountType)
    setToken(response.token)
    await fetchProfile()
  }

  const loginWithGoogle = async (idToken: string) => {
    const response = await api.post<LoginResponse>("/auth/google", { token: idToken })
    localStorage.setItem("sparkd_token", response.token)
    stashLoginAccountType(response.accountType)
    setToken(response.token)
    await fetchProfile()
  }

  const register = async (data: RegisterRequest) => {
    return api.post<RegisterResponse>("/auth/register", data)
  }

  const logout = () => {
    localStorage.removeItem("sparkd_token")
    localStorage.removeItem("sparkd_user_id")
    localStorage.removeItem("sparkd_username")
    localStorage.removeItem(SPARKD_LOGIN_ACCOUNT_TYPE_KEY)
    setToken(null)
    setUser(null)
    window.location.href = "/login"
  }

  const refreshProfile = async () => {
    await fetchProfile()
  }

  const updateUser = (patch: Partial<Record<keyof User, any>>) => {
    setUser(prev => {
      if (!prev) return prev
      const updated = { ...prev }
      for (const key in patch) {
        (updated as any)[key] = (patch as any)[key]
      }
      localStorage.setItem('sparkd_user', JSON.stringify(updated))
      return updated
    })
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated: !!token,
        isLoading,
        login,
        loginWithGoogle,
        register,
        logout,
        refreshProfile,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
