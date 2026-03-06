// Enums
export type Sex = "MALE" | "FEMALE"
export type SwipeType = "LIKE" | "DISLIKE"

// Auth
export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
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

export interface UserProfile {
  userId: string
  username?: string
  nombres: string
  apellidos: string
  telefono: string
  dateOfBirth: string
  sex: Sex
  bio?: string
  location?: string
  website?: string
  profileCompleted: boolean
  photos: Photo[]
  posts: Post[]
  totalPosts: number
  reputation?: number
  verificationLevel?: number
  interests?: string[] | Interest[]
  compatibilityScore?: number
}

export interface CreateProfileRequest {
  nombres: string
  apellidos: string
  sex: Sex
  dateOfBirth: string
  telefono: string
}

export interface UpdateProfileRequest {
  nombres: string
  apellidos: string
  sex: Sex
  dateOfBirth: string
  telefono: string
}

// Reactions
export type ReactionType = 'LOVE' | 'HAHA' | 'WOW' | 'SAD' | 'ANGRY'

export interface Reaction {
  type: ReactionType
  count: number
  userReacted?: boolean
}

export interface ReactionSummary {
  [key: string]: Reaction
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

// Posts
export interface Post {
  id: string
  body: string
  file: string | null
  createdAt: string
  userId: string
  username: string
  permanent: boolean
  expiresAt: string | null
  locked: boolean
  canUnlock: boolean
  unlocked: boolean
  likeCount: number
  commentsCount: number
  repostCount?: number
  message: string | null
  reputation?: number
  verificationLevel?: number
  interests?: string[]
  liked?: boolean
  reactions?: ReactionSummary
  userReaction?: ReactionType | null
  poll?: Poll
}

export interface CreatePostRequest {
  body: string
  file?: string
  permanent: boolean
  durationHours?: number
}

export interface UpdatePostRequest {
  body: string
  file?: string
  permanent: boolean
  durationHours?: number
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
export interface Story {
  id: string
  userId: string
  username: string
  userPhoto?: string
  mediaUrl: string
  caption?: string
  createdAt: string
  expiresAt: string
  viewCount: number
  viewed?: boolean
}

export interface CreateStoryRequest {
  mediaUrl: string
  caption?: string
}

// Groups
export interface Group {
  id: string
  name: string
  description: string
  coverPhoto?: string
  privacy: 'PUBLIC' | 'PRIVATE'
  memberCount: number
  createdAt: string
  isAdmin?: boolean
  isMember?: boolean
}

export interface CreateGroupRequest {
  name: string
  description: string
  privacy: 'PUBLIC' | 'PRIVATE'
  coverPhoto?: string
}

// Chat
export interface Chat {
  chatId: string
  otherUserId: string
  otherUsername: string
  lastMessage: string | null
  lastMessageAt: string | null
}

export interface Message {
  messageId: string
  chatId: string
  senderId: string
  receiverId: string
  content: string
  sentAt: string
}

export interface SendMessageRequest {
  chatId: string
  content: string
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
  interestedIn: Sex
  minAge: number
  maxAge: number
  showMe: boolean
}

export interface SetPreferencesRequest {
  interestedIn: Sex
  minAge: number
  maxAge: number
  showMe: boolean
}

// Notifications
export interface Notification {
  notificationId: string
  type: string
  message: string
  read: boolean
  createdAt: string
  relatedUserId: string
  relatedUsername: string
  targetId?: string
  targetType?: string
}

// Auth state
export interface AuthState {
  token: string | null
  user: UserProfile | null
  isAuthenticated: boolean
  isLoading: boolean
}
