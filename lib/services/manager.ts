import { api } from "@/lib/api"

type ManagerPage<T> = {
  content?: T[]
  totalElements?: number
  totalPages?: number
  number?: number
}

export type ManagerActivityEvent = {
  reportId: string
  type: string
  status: string
  targetType: string
  targetId: string
  reporterUsername?: string | null
  reportedUsername?: string | null
  createdAt: string
}

export type ManagerUserRow = {
  userId: string
  username: string
  email?: string | null
  enabled?: boolean
  locked?: boolean
  premium?: boolean
  fechaRegistro?: string | null
  postCount?: number
}

export type ManagerPostReport = {
  reportId: string
  targetType: string
  targetId: string
  status: string
  reportedUsername?: string | null
  reporterUsername?: string | null
  reason?: string | null
  createdAt: string
}

const normalizePage = <T>(raw: unknown): ManagerPage<T> => {
  if (!raw || typeof raw !== "object") return {}
  const o = raw as Record<string, unknown>
  return {
    content: Array.isArray(o.content) ? (o.content as T[]) : undefined,
    totalElements: typeof o.totalElements === "number" ? o.totalElements : undefined,
    totalPages: typeof o.totalPages === "number" ? o.totalPages : undefined,
    number: typeof o.number === "number" ? o.number : undefined,
  }
}

export const managerService = {
  async activity(params?: { page?: number; limit?: number }) {
    return api.get<{
      events: ManagerActivityEvent[]
      totalElements: number
      totalPages: number
      currentPage: number
    }>(`/api/manager/activity?page=${params?.page ?? 0}&limit=${params?.limit ?? 20}`)
  },

  async users(params?: { username?: string; page?: number; size?: number }) {
    const sp = new URLSearchParams()
    if (params?.username) sp.set("username", params.username)
    sp.set("page", String(params?.page ?? 0))
    sp.set("size", String(params?.size ?? 20))
    const raw = await api.get<unknown>(`/api/manager/users?${sp.toString()}`)
    return normalizePage<ManagerUserRow>(raw)
  },

  async contentQueue(params?: { page?: number; size?: number }) {
    const raw = await api.get<unknown>(
      `/api/manager/posts?page=${params?.page ?? 0}&size=${params?.size ?? 20}`
    )
    return normalizePage<ManagerPostReport>(raw)
  },

  hidePost: (postId: string) => api.post<void>(`/api/manager/posts/${postId}/hide`),
  restorePost: (postId: string) => api.post<void>(`/api/manager/posts/${postId}/restore`),
  deletePost: (postId: string) => api.post<void>(`/api/manager/posts/${postId}/delete`),
}

