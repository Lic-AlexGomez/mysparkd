/**
 * Mutual Plans — shared intent across social + dating + events.
 * Backend contract: see docs/sparkd-mutual-plans-trello.md
 */

export type MutualRelationshipType = "match" | "friend" | "interest" | string

/** Row linking a person to an event with relationship metadata */
export interface MutualPlanConnection {
  userId: string
  username: string
  displayName?: string
  profilePictureUrl?: string | null
  eventId: string
  eventTitle?: string
  relationshipType: MutualRelationshipType
  confidenceScore?: number
  /** ISO start time of the event */
  startsAt?: string
  /** km from viewer when backend resolves geo */
  distanceKm?: number
}

/** Aggregated “shared plan” near the user (same activity / cluster) */
export interface MutualSharedPlanNearYou {
  planId?: string
  eventId: string
  title: string
  startsAt?: string
  distanceKm?: number
  /** Users you’re linked to who are in this bucket */
  connectionCount?: number
  relationshipMix?: MutualRelationshipType[]
  topConnections?: Pick<
    MutualPlanConnection,
    "userId" | "username" | "profilePictureUrl" | "relationshipType"
  >[]
}

export interface MutualPlansUserBundle {
  goingWithYou: MutualPlanConnection[]
  matchesHere: MutualPlanConnection[]
  friendsInterested: MutualPlanConnection[]
  sharedPlansNearYou: MutualSharedPlanNearYou[]
}

export interface MutualPlansEventBundle {
  /** Same sections scoped to one event */
  goingWithYou: MutualPlanConnection[]
  matchesHere: MutualPlanConnection[]
  friendsInterested: MutualPlanConnection[]
}
