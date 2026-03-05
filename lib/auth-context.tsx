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
  loginWithGoogle: (idToken: string) => Promise<void>
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
    try {
      const profile = await api.get<UserProfile>("/api/profile/me")
      setUser(profile)
      localStorage.setItem('sparkd_user', JSON.stringify(profile))
    } catch (error) {
      const savedUser = localStorage.getItem('sparkd_user')
      if (savedUser) {
        setUser(JSON.parse(savedUser))
      } else {
        setUser(null)
      }
    }
  }, [])

  useEffect(() => {
    const storedToken = localStorage.getItem("sparkd_token")
    const storedUser = localStorage.getItem("sparkd_user")
    
    if (storedToken) {
      setToken(storedToken)
      if (storedUser) {
        setUser(JSON.parse(storedUser))
      }
      fetchProfile().finally(() => {
        setIsLoading(false)
      })
    } else {
      setIsLoading(false)
    }
  }, [fetchProfile])

  const login = async (data: LoginRequest) => {
    const response = await api.post<LoginResponse>("/auth/login", data)
    localStorage.setItem("sparkd_token", response.token)
    setToken(response.token)
    
    try {
      const profile = await api.get<UserProfile>("/api/profile/me")
      setUser(profile)
      localStorage.setItem('sparkd_user', JSON.stringify(profile))
    } catch (error) {
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

  const loginWithGoogle = async (idToken: string) => {
    const response = await api.post<LoginResponse>("/auth/google", { token: idToken })
    localStorage.setItem("sparkd_token", response.token)
    console.log("[Auth] Token recibido del servidor:", response.token)
    setToken(response.token)
    
    try {
      const profile = await api.get<UserProfile>("/api/profile/me")
      setUser(profile)
      localStorage.setItem('sparkd_user', JSON.stringify(profile))
    } catch (error) {
      await fetchProfile()
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
        loginWithGoogle,
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
