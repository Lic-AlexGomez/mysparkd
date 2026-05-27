// Enums
export type Sex = "MALE" | "FEMALE"

/** Preferencia de matching: backend acepta MALE, FEMALE o BOTH (ambos). */
export type InterestedIn = Sex | "BOTH"
export type SwipeType = "LIKE" | "DISLIKE"

/** Modo de producto: enum backend `AccountType` (no confundir con `user.premium`). */
export type AccountType = "DATING" | "SOCIAL" | "BOTH"

// Auth
export interface LoginRequest {
  username: string
  password: string
}

/** Auth endpoints (`/auth/login`, `/auth/google`, verify-email, etc.) may include plan/mode. */
export interface LoginResponse {
  token: string
  accountType?: AccountType | string
  userId?: string
}

export interface RegisterRequest {
  username: string
  password: string
  email: string
}

export interface RegisterResponse {
  username: string
  message: string
}

export interface EventRating {
  score: number
  comment?: string
  createdAt?: string
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  token: string
  newPassword: string
}

// Profile
export interface Photo {
  id?: string
  photoId?: string
  url: string
  isPrimary?: boolean
  primary?: boolean
  position?: number
  userId?: string | null
  profileId?: string | null
  createdAt?: string | null
}

/** Perfil autenticado (alias útil en estado de auth). */
export type User = UserProfile

export interface UserProfile {
  userId: string
  username?: string
  /** Correo de la cuenta; puede venir en GET /api/profile/me según backend. */
  email?: string | null
  /** Email secundario de recuperación (`UserProfileResponseDTO`). */
  recoveryEmail?: string | null
  accountType?: AccountType | string
  nombres: string
  apellidos: string
  telefono: string
  dateOfBirth: string
  sex: Sex
  bio?: string
  location?: string
  latitude?: number
  longitude?: number
  url?: string
  website?: string
  voiceNoteUrl?: string
  voiceIntroUrl?: string
  coverPhoto?: string
  coverPictureUrl?: string
  profilePictureUrl?: string
  profileCompleted: boolean
  premium: boolean
  showPremiumBadge?: boolean
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  subscriptionStatus?: 'ACTIVE' | 'CANCELED' | 'PAST_DUE'
  currentPeriodEnd?: string
  photos: Photo[]
  posts: Post[]
  totalPosts: number
  followersCount?: number
  followingCount?: number
  reputation?: number
  verificationLevel?: number
  interests?: string[] | Interest[]
  compatibilityScore?: number
  visibility?: 'PUBLIC' | 'PRIVATE'
  preferredLanguage?: string
  // Event stats (desde backend commit PET BY FRONT)
  eventsCreatedCount?: number
  eventsCancelledCount?: number
}

export interface CreateProfileRequest {
  nombres: string
  apellidos: string
  sex: Sex
  dateOfBirth: string
  telefono?: string
  bio?: string
  /** Modo producto al crear perfil (p. ej. `DATING` desde onboarding). */
  accountType?: AccountType | string
  latitude?: number
  longitude?: number
  preferredLanguage?: string
}

export interface UpdateProfileRequest {
  nombres: string
  apellidos: string
  username: string
  accountType?: AccountType | string
  sex: Sex
  dateOfBirth: string
  telefono: string
  bio?: string | null
  url?: string | null
  visibility?: "PUBLIC" | "PRIVATE"
  showPremiumBadge?: boolean
  location?: string
  latitude?: number
  longitude?: number
  preferredLanguage?: string
}

// FastDate
export type DateCategory = 'FOOD' | 'ACTIVITY' | 'EVENT' | 'CHILL' | 'ADVENTURE' | 'OPEN_SUGGESTION'
export type Plan = 'CAFE' | 'RESTAURANT' | 'BAR' | 'PARK' | 'BEACH' | 'MALL' | 'CINEMA' | 'OTHER' | 'OPEN_SUGGESTION'
export type PlaceType = 'CAFE' | 'RESTAURANT' | 'BAR' | 'PARK' | 'BEACH' | 'MALL' | 'CINEMA' | 'OTHER' | 'OPEN_SUGGESTION'
export type DateCardStatus = 'ACTIVE' | 'MATCHED' | 'CANCELLED' | 'EXPIRED'
export type InterestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED'

export interface DateCard {
  id: string
  title: string
  message?: string
  dateTime: string
  locationZone: string
  category: DateCategory
  detail?: string
  plans: Plan[]
  placeTypes: PlaceType[]
  status: DateCardStatus
  expiresAt: string
  createdAt: string
  userId: string
  username: string
  mainPhotoUrl?: string
  /** Feed / mis citas: contador para UI rica (opcional). */
  totalInterests?: number
  nearbyMatches?: number
  compatibility?: number
  coverImageUrl?: string
  displayName?: string
  /** Edad del autor de la cita (feed o derivada de fecha de nacimiento). */
  authorAge?: number
  /** Intereses de perfil del autor (para compatibilidad en cliente). */
  authorInterests?: Array<string | Interest>
}

export interface CreateDateCardRequest {
  title: string
  message?: string
  dateTime: string
  locationZone: string
  category: DateCategory
  detail?: string
  plans: Plan[]
  placeTypes: PlaceType[]
}

export interface DateCardInterest {
  interestId: string
  userId: string
  profilePicture?: string
  profileId?: string
  message?: string
  status: InterestStatus
}

export interface MyDateCard {
  dateCardId: string
  title: string
  message?: string
  dateTime?: string
  locationZone?: string
  category?: DateCategory
  detail?: string
  plans?: Plan[]
  placeTypes?: PlaceType[]
  status?: DateCardStatus
  expiresAt?: string
  createdAt?: string
  totalInterests?: number
  interests: DateCardInterest[]
}

export interface SentInterest {
  interestId: string
  message?: string
  status: InterestStatus
  dateCardId: string
  title: string
  dateStatus: string
  profileId?: string
  profilePicture?: string
}

// Admin Stats
export interface AdminStats {
  totalUsers: number
  premiumUsers: number
  freeUsers: number
  activeUsers: number
  activeUsersLast24h: number
  lockedUsers: number
  newUsersLast7Days: number
  usersByProvider: Record<string, number>
}

export interface UserGrowth {
  date: string
  count: number
}

// Reactions
export type ReactionType = 'LIKE' | 'LOVE' | 'LAUGH' | 'WOW' | 'SAD' | 'FIRE'
export type ReactionTargetType = 'POST' | 'COMMENT' | 'REPLY'

export interface Reaction {
  type: ReactionType | string
  count: number
  userReacted?: boolean
}

export interface ReactionSummary {
  [key: string]: Reaction
}

export interface ReactionRequest {
  targetId: string
  targetType: ReactionTargetType
  reactionType: ReactionType
}

// Polls
export interface PollOption {
  id: string
  text: string
  votes: number
  percentage: number
}

export interface Poll {
  id: string
  question: string
  options: PollOption[]
  totalVotes: number
  expiresAt: string
  userVoted?: string | null
  allowMultiple: boolean
}

/** Estado de boost de un post permanente (`GET /api/posts/{id}/boost/info`). */
export interface PostBoostInfo {
  postId: string
  permanent: boolean
  feedActive: boolean
  expiresAt: string | null
  timeUntilExpiry: string
  boostCount: number
  nextBoostPriceCents: number
  nextBoostPriceUsd: number
}

// Posts
export type PostVisibility = 'PUBLIC' | 'FOLLOWERS' | 'PRIVATE'

export interface Post {
  id: string
  body: string
  file: string | null
  createdAt: string
  userId: string
  username: string
  userPhoto?: string
  permanent: boolean
  expiresAt: string | null
  locked: boolean
  visibility: PostVisibility
  canUnlock: boolean
  unlocked: boolean
  likeCount: number
  commentsCount: number
  repostCount?: number
  repostedByCurrentUser?: boolean
  shareCount?: number
  viewCount?: number
  message: string | null
  reputation?: number
  verificationLevel?: number
  interests?: Array<string | Interest>
  liked?: boolean
  likedByCurrentUser?: boolean
  saved?: boolean
  reactions?: ReactionSummary
  userReaction?: ReactionType | null
  poll?: Poll | null
  media?: {
    mediaUrl: string
    mediaType?: string
    mediaPublicId?: string
    width?: number
    height?: number
    duration?: number
    fileSize?: number
    format?: string
  }
}

export interface CreatePostRequest {
  body: string
  file?: string
  permanent: boolean
  durationHours?: number
  locked?: boolean
  privat_e?: boolean
  visibility?: PostVisibility
}

export interface UpdatePostRequest {
  body: string
  file?: string
  permanent: boolean
  durationHours?: number
  locked?: boolean
  privat_e?: boolean
  visibility?: PostVisibility
}

// Comments
export interface Comment {
  commentsId: string
  text: string
  createdAt: string
  lastUpdated: string
  username: string
  userId: string
  locked: boolean
  totalComments: number
  likeCount: number
  commentReplies: number
  liked?: boolean
  reactions?: ReactionSummary
  userReaction?: ReactionType | null
  profilePictureUrl?: string
}

export interface CommentReply {
  commentReplyId: string
  body: string
  createdAt: string
  lastUpdated: string
  username: string
  userId: string
  likeCount: number
  liked?: boolean
  reactions?: ReactionSummary
  userReaction?: ReactionType | null
}

export interface CreateCommentRequest {
  text: string
}

// Swipes
export interface SwipeRequest {
  targetUserId: string
  type: SwipeType
}

export interface SwipeResponse {
  match: boolean
  message: string
  /** Swipes restantes hoy (solo cuenta free). `null` en premium. */
  swipesRemaining?: number
  /** Si el usuario autenticado es premium, el backend puede omitir límites. */
  premium?: boolean
}

// Matches
export interface Match {
  matchId: string
  userId: string
  nombre: string
  apellidos?: string
  edad?: number
  photoUrl?: string
  bio?: string
  interests?: string[]
  compatibilityScore?: number
  lastMessage?: string
  lastMessageAt?: string
  matchedAt: string
}

// Stories
export interface StoryResponse {
  id: string
  userId: string
  username: string
  profilePictureUrl?: string
  mediaUrl: string
  mediaType?: string
  caption?: string
  audience?: StoryAudience
  createdAt: string
  expiresAt: string
  viewCount: number
  hasViewed: boolean
  myReaction?: ReactionType
}

export interface StoryGroup {
  userId: string
  username: string
  profilePictureUrl?: string
  hasUnread: boolean
  stories: StoryResponse[]
}

// keep Story as alias for backwards compat
export type Story = StoryResponse

export interface CreateStoryRequest {
  mediaUrl: string
  caption?: string
  audience?: StoryAudience
}

// Events
export type EventRole = 'ADMIN' | 'MODERATOR' | 'GUEST'
export type EventStatus = 'OPEN' | 'FULL' | 'CANCELLED' | 'FINISHED' | 'EXPIRED'
export type EventCategory = 'PARTY' | 'DINNER' | 'CONCERT' | 'SPORTS' | 'NETWORKING' | 'OUTDOOR' | 'GROUP_DATE' | 'CULTURAL' | 'OTHER'
export type EventGroupInviteRequestStatus = 'PENDING_INTERNAL' | 'PENDING_ADMIN' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
export type EventGroupInviteRequestMemberStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED'

export interface Event {
  eventId: string
  title: string
  description?: string
  category?: EventCategory
  status?: EventStatus
  free?: boolean
  minAge?: number
  maxAge?: number
  latitude?: number
  longitude?: number
  maxGuests?: number
  currentApprovedCount?: number
  startsAt?: string
  endsAt?: string
  createdAt?: string
  officialAddress?: string
  sharedAddress?: string
  addressMatched?: boolean
  locationVerified?: boolean
  locationMismatchReason?: string
  /** Portada del meetup (feed / detalle). */
  coverPhotoUrl?: string
  coverPhoto?: string
  creatorId?: string
  creatorUsername?: string
  creatorProfilePictureUrl?: string
  /** Alias que envía `/api/activity-feed` para la foto del creador. */
  creatorPhotoUrl?: string
  /** Zona / país del feed (p. ej. `locationZone` del backend). */
  zone?: string
  /** Alias que a veces envía `/api/activity-feed` u otros DTOs. */
  locationZone?: string
  // Rating fields (desde backend commit PET BY FRONT)
  averageRating?: number
  ratingCount?: number
  myRating?: EventRating
}

export interface EventFilters {
  category?: EventCategory
  free?: boolean
  minAge?: number
  maxAge?: number
  lat?: number
  lng?: number
  radiusKm?: number
}

export type EventGroupMediaType = 'IMAGE' | 'VIDEO' | 'AUDIO' | 'FILE'

export interface EventGroupReaction {
  userId: string
  username: string
  profilePictureUrl?: string | null
  reaction: ReactionType
}

export interface EventPollOption {
  id: string
  optionText: string
  voteCount: number
  votedByMe: boolean
}

export interface EventPoll {
  id: string
  groupId: string
  question: string
  expiresAt?: string | null
  createdAt: string
  expired: boolean
  options: EventPollOption[]
}

export interface EventGroupMessage {
  id: string
  groupId: string
  senderId?: string | null
  senderUsername?: string
  senderProfilePictureUrl?: string | null
  content?: string | null
  sentAt: string
  editedAt?: string | null
  deleted: boolean
  system: boolean
  pinned?: boolean
  mediaType?: EventGroupMediaType | null
  mediaUrl?: string | null
  durationSeconds?: number | null
  pollId?: string | null
  poll?: EventPoll | null
  reactions?: EventGroupReaction[]
}

export interface EventParticipant {
  userId: string
  username: string
  profilePictureUrl?: string | null
  role: EventRole
  joinedAt?: string
}

export interface EventGroupMember extends EventParticipant {
  mutedUntil?: string | null
}

export interface EventGroupInviteLink {
  inviteId: string
  token: string
  targetRole: Extract<EventRole, 'MODERATOR' | 'GUEST'>
  expiresAt?: string | null
  maxUses: number
  usedCount: number
}

export interface EventGroupJoinRequestMember {
  userId: string
  username: string
  profilePictureUrl?: string | null
  status: EventGroupInviteRequestMemberStatus
  respondedAt?: string | null
}

export interface EventGroupJoinRequest {
  id: string
  eventId: string
  eventTitle: string
  inviterId: string
  inviterUsername: string
  inviterProfilePictureUrl?: string | null
  message?: string | null
  status: EventGroupInviteRequestStatus
  createdAt: string
  members: EventGroupJoinRequestMember[]
}

export interface EventGroupSettings {
  slowMode?: boolean
  adminOnlyMode?: boolean
}

export interface EventCapacityUpdate {
  type: 'CAPACITY_UPDATE'
  eventId: string
  currentApprovedCount: number
  maxGuests: number
  status: Extract<EventStatus, 'OPEN' | 'FULL'>
}

export type EventGroupSocketPayload =
  | EventGroupMessage
  | { type: 'MESSAGE_DELETED'; messageId: string; groupId: string }
  | { type: 'SETTINGS_UPDATED'; slowMode: boolean; adminOnlyMode: boolean }
  | { type: 'MEMBER_KICKED'; userId: string; groupId: string }
  | { type: 'POLL_UPDATED'; groupId: string; poll: EventPoll }

// Groups
export type GroupRole = 'ADMIN' | 'MODERATOR' | 'GUEST'
export type GroupFeedVisibility = 'GLOBAL' | 'LOCAL' | 'FOLLOWERS_ONLY' | 'GROUPS_ONLY'
export type GroupTalkPermission = 'ALL' | 'MODS_AND_ADMINS' | 'ONLY_ADMIN'

export interface Group {
  id: string
  name: string
  description?: string
  coverPhoto?: string
  coverPhotoUrl?: string
  privacy?: 'PUBLIC' | 'PRIVATE'
  isPublic?: boolean
  feedVisibility?: GroupFeedVisibility
  whoCanTalk?: GroupTalkPermission
  creatorId?: string
  creatorUsername?: string
  creatorProfilePictureUrl?: string
  myRole?: GroupRole | null
  category?: string
  topics?: string[]
  memberCount: number
  createdAt: string
  isAdmin?: boolean
  isMember?: boolean
}

export interface CreateGroupRequest {
  name: string
  description?: string
  feedVisibility: GroupFeedVisibility
  whoCanTalk?: GroupTalkPermission
  isPublic?: boolean
  category?: string
  topics?: string[]
  /** Portada; el backend puede mapear a `coverPhotoUrl` / `coverPhoto`. */
  coverPhotoUrl?: string
  coverPhoto?: string
}

export interface GroupMember {
  userId: string
  username: string
  profilePictureUrl?: string
  role: GroupRole
  joinedAt: string
  muted: boolean
}

export type GroupMessageMediaType = "IMAGE" | "VIDEO" | "AUDIO" | "FILE"

export interface GroupMessage {
  id: string
  groupId: string
  senderId?: string
  senderUsername?: string
  senderProfilePictureUrl?: string
  content?: string | null
  sentAt: string
  editedAt?: string | null
  deleted: boolean
  system: boolean
  mediaType?: GroupMessageMediaType | null
  mediaUrl?: string | null
  durationSeconds?: number | null
}

export interface GroupInviteLink {
  inviteId: string
  token: string
  targetRole: 'MODERATOR' | 'GUEST'
  expiresAt?: string | null
  maxUses: number
  usedCount: number
}

// Chat
export interface Chat {
  lastSeen: null
  chatId: string
  otherUserId: string
  otherUsername: string
  otherUserPhoto?: string
  senderProfilePicture?: string
  lastMessage: string | null
  lastMessageAt: string | null
  unread?: number
  otherUserLastSeen?: string | null
  /** Backend: DIRECT (DM desde perfil) vs GENERAL (resto, p. ej. match). */
  chatCategory?: "DIRECT" | "GENERAL"
  /** Optional server hints for context-aware UI (BFF / future JVM). */
  linkedEventId?: string
  linkedGroupId?: string
  linkedFastDateId?: string
  linkedContextTitle?: string
}

export interface Message {
  messageId?: string
  id?: string
  chatId: string
  senderId: string
  receiverId: string
  content: string
  sentAt: string
  mediaType?: string
  media?: {
    mediaUrl: string
    mediaPublicId?: string
    width?: number
    height?: number
    duration?: number
    fileSize?: number
    format?: string
  }
  read?: boolean
  edited?: boolean
  editedAt?: string
  deletedForEveryone?: boolean
  system?: boolean
  reactions?: MessageReaction[]
  pinnedAt?: string | null
}

export interface SendMessageRequest {
  chatId: string
  content: string
  mediaUrl?: string
}

// Interests
export interface Interest {
  interestId: string
  name: string
  icon: string
  category: string
}

// Preferences
export interface UserPreferences {
  interestedIn: InterestedIn
  minAge: number
  maxAge: number
  showMe: boolean
}

export interface SetPreferencesRequest {
  interestedIn: InterestedIn
  minAge: number
  maxAge: number
  showMe: boolean
}

// Privacy Settings
export type PrivacyOption = 'EVERYONE' | 'FOLLOWERS' | 'NOBODY'
export type DmPrivacyOption = 'EVERYONE' | 'FOLLOWERS' | 'MATCHES'

export interface PrivacySettings {
  whoCanSeeMyPosts: PrivacyOption
  whoCanComment: PrivacyOption
  whoCanSendDM: DmPrivacyOption
  showOnlineStatus: boolean
  showLastSeen: boolean
}

// Sparkling List
export interface SparklingListMember {
  userId: string
  username: string
  profilePictureUrl?: string
}

// Message Reactions
export interface MessageReaction {
  userId: string
  username: string
  profilePictureUrl?: string
  reaction: ReactionType
}

// Story Audience
export type StoryAudience = 'PUBLIC' | 'SPARKLING_LIST'

// Notifications
export interface Notification {
  notificationId: string
  senderId: string
  senderUsername: string
  receiverId: string
  receiverUsername: string
  title: string
  data: string
  targetId?: string
  targetType?: string
  read: boolean
  createdAt: string
  senderProfilePicture?: string
}

// Subscription
export interface UserSubscription {
  id: string
  userId: string
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  status?: 'ACTIVE' | 'CANCELED' | 'PAST_DUE' | string
  currentPeriodEnd: string
  active: boolean
  trial?: boolean
  cancelAtPeriodEnd?: boolean
  /** Mensaje informativo del backend (p. ej. tras solicitar cancelación). */
  message?: string | null
}

// Auth state
export interface AuthState {
  token: string | null
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}
