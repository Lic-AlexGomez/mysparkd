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
import type {
  UserProfile,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
} from "@/lib/types"

interface AuthContextType {
  token: string | null
  user: UserProfile | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (data: LoginRequest) => Promise<void>
  register: (data: RegisterRequest) => Promise<RegisterResponse>
  logout: () => void
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchProfile = useCallback(async () => {
    console.log('[AuthContext] Fetching profile...')
    try {
      const profile = await api.get<UserProfile>("/api/profile/me")
      console.log('[AuthContext] Profile fetched:', profile)
      setUser(profile)
      localStorage.setItem('sparkd_user', JSON.stringify(profile))
    } catch (error) {
      console.error('[AuthContext] Error fetching profile:', error)
      // Si falla, intentar obtener del localStorage
      const savedUser = localStorage.getItem('sparkd_user')
      console.log('[AuthContext] Saved user from localStorage:', savedUser)
      if (savedUser) {
        setUser(JSON.parse(savedUser))
      } else {
        setUser(null)
      }
    }
  }, [])

  useEffect(() => {
    console.log('[AuthContext] Initializing...')
    const storedToken = localStorage.getItem("sparkd_token")
    const storedUser = localStorage.getItem("sparkd_user")
    console.log('[AuthContext] Stored token:', storedToken ? 'exists' : 'null')
    console.log('[AuthContext] Stored user:', storedUser ? 'exists' : 'null')
    
    if (storedToken) {
      setToken(storedToken)
      if (storedUser) {
        console.log('[AuthContext] Setting user from localStorage')
        setUser(JSON.parse(storedUser))
      }
      fetchProfile().finally(() => {
        console.log('[AuthContext] Profile fetch completed')
        setIsLoading(false)
      })
    } else {
      console.log('[AuthContext] No token found')
      setIsLoading(false)
    }
  }, [fetchProfile])

  const login = async (data: LoginRequest) => {
    const response = await api.post<LoginResponse>("/auth/login", data)
    localStorage.setItem("sparkd_token", response.token)
    setToken(response.token)
    
    // Intentar obtener el perfil
    try {
      const profile = await api.get<UserProfile>("/api/profile/me")
      setUser(profile)
      localStorage.setItem('sparkd_user', JSON.stringify(profile))
    } catch (error) {
      console.error('[AuthContext] Profile not found after login, creating mock user')
      // Si no existe perfil, crear uno mock con los datos del login
      const mockUser: UserProfile = {
        userId: 'user_' + Date.now(),
        nombres: data.username,
        apellidos: '',
        telefono: '',
        sex: 'MALE',
        profileCompleted: false,
        photos: [],
        posts: [],
        totalPosts: 0,
        reputation: 75,
        verificationLevel: 1
      }
      setUser(mockUser)
      localStorage.setItem('sparkd_user', JSON.stringify(mockUser))
    }
  }

  const register = async (data: RegisterRequest) => {
    return api.post<RegisterResponse>("/auth/register", data)
  }

  const logout = () => {
    localStorage.removeItem("sparkd_token")
    localStorage.removeItem("sparkd_user_id")
    setToken(null)
    setUser(null)
    window.location.href = "/login"
  }

  const refreshProfile = async () => {
    await fetchProfile()
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated: !!token,
        isLoading,
        login,
        register,
        logout,
        refreshProfile,
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
