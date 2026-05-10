import { api } from '../api'
import { computeAgeFromDateOfBirth } from '../utils'
import { extractAuthorInterestsFromDateCardRaw } from './compatibility'
import type {
  DateCard,
  CreateDateCardRequest,
  MyDateCard,
  SentInterest,
  DateCategory,
  PlaceType,
  Plan,
  DateCardStatus,
  DateCardInterest,
  InterestStatus,
} from '../types'

function pickNum(o: Record<string, unknown>, ...keys: string[]): number | undefined {
  for (const k of keys) {
    const v = o[k]
    if (typeof v === 'number' && Number.isFinite(v)) return v
  }
  return undefined
}

function pickStr(o: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const k of keys) {
    const v = o[k]
    if (typeof v === 'string' && v.trim()) return v.trim()
    if (typeof v === 'number' && Number.isFinite(v)) return String(v)
  }
  return undefined
}

function pickArr(o: Record<string, unknown>, ...keys: string[]): unknown[] {
  for (const k of keys) {
    const v = o[k]
    if (Array.isArray(v)) return v
  }
  return []
}

/** Spring Page, wrappers `{ data: [] }`, HAL `_embedded`, etc. */
function unwrapDateCardsFeedArray(raw: unknown): unknown[] {
  if (raw == null) return []
  if (Array.isArray(raw)) return raw
  if (typeof raw !== 'object') return []
  const o = raw as Record<string, unknown>

  const directKeys = [
    'content',
    'data',
    'cards',
    'items',
    'results',
    'dateCards',
    'date_cards',
    'rows',
    'records',
  ]
  for (const k of directKeys) {
    const v = o[k]
    if (Array.isArray(v)) return v
  }

  const embedded = o._embedded
  if (embedded && typeof embedded === 'object') {
    for (const v of Object.values(embedded as Record<string, unknown>)) {
      if (Array.isArray(v)) return v
    }
  }

  return []
}

/** Acepta respuestas camelCase (Jackson) o snake_case. */
export function normalizeDateCardFromApi(raw: unknown): DateCard | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const id = pickStr(
    o,
    'id',
    'dateCardId',
    'date_card_id',
    'uuid',
    'cardId',
    'card_id'
  )
  if (!id) return null

  const plansRaw = pickArr(o, 'plans', 'planTypes')
  const plans =
    plansRaw.length > 0
      ? (plansRaw.map((p) => String(p)) as Plan[])
      : (pickArr(o, 'placeTypes', 'place_types').map((p) => String(p)) as Plan[])

  const placeTypes =
    pickArr(o, 'placeTypes', 'place_types').length > 0
      ? (pickArr(o, 'placeTypes', 'place_types').map((p) => String(p)) as PlaceType[])
      : (plans as PlaceType[])

  const nowIso = new Date().toISOString()

  let authorAge = pickNum(o, 'authorAge', 'author_age', 'age', 'userAge', 'user_age')
  if (authorAge == null) {
    const dob = pickStr(
      o,
      'authorDateOfBirth',
      'author_date_of_birth',
      'dateOfBirth',
      'date_of_birth'
    )
    const computed = computeAgeFromDateOfBirth(dob)
    if (computed != null) authorAge = computed
  }

  return {
    id,
    title: pickStr(o, 'title') ?? '',
    message: pickStr(o, 'message'),
    dateTime: pickStr(o, 'dateTime', 'date_time') ?? pickStr(o, 'createdAt', 'created_at') ?? nowIso,
    locationZone: pickStr(o, 'locationZone', 'location_zone') ?? '',
    category: (pickStr(o, 'category') ?? 'FOOD') as DateCategory,
    detail: pickStr(o, 'detail'),
    plans,
    placeTypes,
    status: (pickStr(o, 'status') ?? 'ACTIVE') as DateCardStatus,
    expiresAt: pickStr(o, 'expiresAt', 'expires_at') ?? nowIso,
    createdAt: pickStr(o, 'createdAt', 'created_at') ?? nowIso,
    userId: pickStr(o, 'userId', 'user_id') ?? '',
    username: pickStr(o, 'username') ?? '—',
    mainPhotoUrl: pickStr(o, 'mainPhotoUrl', 'main_photo_url', 'profilePictureUrl', 'profile_picture_url'),
    totalInterests: pickNum(o, 'totalInterests', 'total_interests'),
    nearbyMatches: pickNum(o, 'nearbyMatches', 'nearby_matches'),
    compatibility: pickNum(o, 'compatibility'),
    coverImageUrl: pickStr(o, 'coverImageUrl', 'cover_image_url'),
    displayName: pickStr(o, 'displayName', 'display_name'),
    authorAge,
    authorInterests: extractAuthorInterestsFromDateCardRaw(o),
  }
}

function normalizeInterest(raw: unknown): DateCardInterest | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const interestId = pickStr(o, 'interestId', 'interest_id')
  if (!interestId) return null
  return {
    interestId,
    userId: pickStr(o, 'userId', 'user_id') ?? '',
    profilePicture: pickStr(o, 'profilePicture', 'profile_picture'),
    profileId: pickStr(o, 'profileId', 'profile_id'),
    message: pickStr(o, 'message'),
    status: (pickStr(o, 'status') ?? 'PENDING') as InterestStatus,
  }
}

export function normalizeMyDateCardFromApi(raw: unknown): MyDateCard | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const dateCardId = pickStr(o, 'dateCardId', 'date_card_id')
  if (!dateCardId) return null

  const plansRaw = pickArr(o, 'plans', 'planTypes')
  const plans =
    plansRaw.length > 0
      ? (plansRaw.map((p) => String(p)) as Plan[])
      : (pickArr(o, 'placeTypes', 'place_types').map((p) => String(p)) as Plan[])

  const interestsRaw = o.interests ?? []
  const interests = Array.isArray(interestsRaw)
    ? (interestsRaw.map(normalizeInterest).filter((x): x is DateCardInterest => x != null))
    : []

  const total =
    typeof o.totalInterests === 'number'
      ? o.totalInterests
      : typeof o.total_interests === 'number'
        ? o.total_interests
        : undefined

  const nowIso = new Date().toISOString()

  return {
    dateCardId,
    title: pickStr(o, 'title') ?? '',
    message: pickStr(o, 'message'),
    dateTime: pickStr(o, 'dateTime', 'date_time'),
    locationZone: pickStr(o, 'locationZone', 'location_zone'),
    category: pickStr(o, 'category') as DateCategory | undefined,
    detail: pickStr(o, 'detail'),
    plans: plans.length ? plans : undefined,
    placeTypes:
      pickArr(o, 'placeTypes', 'place_types').length > 0
        ? (pickArr(o, 'placeTypes', 'place_types').map((p) => String(p)) as PlaceType[])
        : undefined,
    status: (pickStr(o, 'status') ?? 'ACTIVE') as DateCardStatus,
    expiresAt: pickStr(o, 'expiresAt', 'expires_at'),
    createdAt: pickStr(o, 'createdAt', 'created_at'),
    totalInterests: total,
    interests,
  }
}

async function tryFetchDateCardById(id: string): Promise<DateCard | null> {
  try {
    const raw = await api.get<unknown>(`/api/date-cards/${id}`)
    return normalizeDateCardFromApi(raw)
  } catch {
    return null
  }
}

/**
 * Tarjetas que solo vienen de /mine suelen estar incompletas; si existe GET /api/date-cards/{id},
 * rellenamos detalle. Siempre mantenemos autor actual como fallback visual.
 */
export async function enrichDateCardsOutsideFeed(
  merged: DateCard[],
  feedIds: Set<string>,
  viewer: {
    userId: string
    username?: string
    profilePictureUrl?: string
    displayName?: string
    viewerAge?: number
  }
): Promise<DateCard[]> {
  const uname = viewer.username?.trim() || viewer.displayName?.trim() || '—'
  const enriched = await Promise.all(
    merged.map(async (card) => {
      const cid = String(card.id)
      if (feedIds.has(cid)) return card
      const full = await tryFetchDateCardById(cid)
      if (!full) return card
      return {
        ...full,
        userId: full.userId || viewer.userId,
        username: full.username?.trim() || uname,
        mainPhotoUrl: full.mainPhotoUrl ?? viewer.profilePictureUrl,
        totalInterests: full.totalInterests ?? card.totalInterests,
        nearbyMatches: full.nearbyMatches ?? card.nearbyMatches,
        compatibility: full.compatibility ?? card.compatibility,
        coverImageUrl: full.coverImageUrl ?? card.coverImageUrl,
        displayName: full.displayName ?? card.displayName,
        authorAge: full.authorAge ?? card.authorAge,
        authorInterests: full.authorInterests ?? card.authorInterests,
      }
    })
  )
  return enriched.sort(
    (a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
  )
}

/** El feed público suele excluir las propias tarjetas; las mezclamos desde GET /mine (solo ACTIVE). */
export function mergeDateCardFeedWithMine(
  feed: DateCard[],
  mine: MyDateCard[],
  viewer: {
    userId: string
    username?: string
    profilePictureUrl?: string
    displayName?: string
    /** Edad del usuario actual (tarjetas propias desde /mine). */
    viewerAge?: number
  }
): DateCard[] {
  const seen = new Set(feed.map((c) => String(c.id)))
  const nowIso = new Date().toISOString()
  const uname =
    viewer.username?.trim() ||
    viewer.displayName?.trim() ||
    '—'

  const extra: DateCard[] = []
  for (const m of mine) {
    const status = m.status ?? 'ACTIVE'
    if (status !== 'ACTIVE') continue
    const id = String(m.dateCardId ?? '')
    if (!id || seen.has(id)) continue
    seen.add(id)
    const plans = m.plans ?? []
    const placeTypes = (m.placeTypes ?? m.plans ?? []) as PlaceType[]
    extra.push({
      id,
      title: m.title ?? '',
      message: m.message,
      dateTime: m.dateTime ?? m.createdAt ?? nowIso,
      locationZone: m.locationZone ?? '',
      category: (m.category ?? 'FOOD') as DateCategory,
      detail: m.detail,
      plans,
      placeTypes,
      status,
      expiresAt: m.expiresAt ?? nowIso,
      createdAt: m.createdAt ?? nowIso,
      userId: viewer.userId,
      username: uname,
      mainPhotoUrl: viewer.profilePictureUrl,
      totalInterests: m.totalInterests,
      authorAge: viewer.viewerAge,
    })
  }

  return [...feed, ...extra].sort(
    (a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
  )
}

export interface FeedFilter {
  maxDistanceKm?: number
  minAge?: number
  maxAge?: number
  minCompatibility?: number
  beforeDateTime?: string
  expiresBefore?: string
}

export const fastDateService = {
  async getFeed(filter?: FeedFilter): Promise<DateCard[]> {
    // El backend usa GET con @ModelAttribute (query params)
    const params = new URLSearchParams()
    if (filter?.maxDistanceKm) params.set('maxDistanceKm', String(filter.maxDistanceKm))
    if (filter?.minAge) params.set('minAge', String(filter.minAge))
    if (filter?.maxAge) params.set('maxAge', String(filter.maxAge))
    if (filter?.minCompatibility) params.set('minCompatibility', String(filter.minCompatibility))
    if (filter?.beforeDateTime) params.set('beforeDateTime', filter.beforeDateTime)
    if (filter?.expiresBefore) params.set('expiresBefore', filter.expiresBefore)
    const qs = params.toString()
    const url = `/api/date-cards/feed${qs ? '?' + qs : ''}`
    const normalizeList = (payload: unknown) =>
      unwrapDateCardsFeedArray(payload)
        .map(normalizeDateCardFromApi)
        .filter((x): x is DateCard => x != null)

    let rows = normalizeList(await api.get<unknown>(url))

    // Algunos despliegues exponen el feed solo por POST con body de filtros.
    if (rows.length === 0) {
      try {
        rows = normalizeList(await api.post<unknown>(url, filter ?? {}))
      } catch {
        // Solo GET
      }
    }

    return rows
  },

  async create(data: CreateDateCardRequest): Promise<void> {
    return api.post('/api/date-cards/create', data)
  },

  async update(id: string, data: Partial<CreateDateCardRequest>): Promise<void> {
    return api.put(`/api/date-cards/${id}`, data)
  },

  async delete(id: string): Promise<void> {
    return api.delete(`/api/date-cards/${id}`)
  },

  async getMine(): Promise<MyDateCard[]> {
    const raw = await api.get<unknown>('/api/date-cards/mine')
    if (!Array.isArray(raw)) return []
    return raw.map(normalizeMyDateCardFromApi).filter((x): x is MyDateCard => x != null)
  },

  async sendInterest(dateCardId: string, message?: string): Promise<void> {
    return api.post('/api/fast-date/interests/interested', { dateCardId, message })
  },

  async respondInterest(interestId: string, accept: boolean): Promise<{ chatId?: string }> {
    return api.post<{ chatId?: string }>('/api/fast-date/interests/respond', { interestId, accept })
  },

  async getSentInterests(): Promise<SentInterest[]> {
    return api.get<SentInterest[]>('/api/fast-date/interests/mine/sent')
  },
}
