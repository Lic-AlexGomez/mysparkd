import type { Post, UserProfile } from '../types'

export const searchService = {
  searchUsers(
    users: UserProfile[],
    query: string,
    filters?: {
      minReputation?: number
      verificationLevel?: number
      interests?: string[]
    }
  ): UserProfile[] {
    let results = users.filter(user => {
      const searchText = `${user.nombres} ${user.apellidos}`.toLowerCase()
      return searchText.includes(query.toLowerCase())
    })

    if (filters?.minReputation) {
      results = results.filter(u => (u.reputation || 0) >= filters.minReputation!)
    }

    if (filters?.verificationLevel !== undefined) {
      results = results.filter(u => (u.verificationLevel || 0) >= filters.verificationLevel!)
    }

    if (filters?.interests && filters.interests.length > 0) {
      results = results.filter(u => 
        u.interests?.some(i => filters.interests!.includes(i))
      )
    }

    return results
  },

  searchPosts(posts: Post[], query: string): Post[] {
    return posts.filter(post => 
      post.body.toLowerCase().includes(query.toLowerCase()) ||
      post.username.toLowerCase().includes(query.toLowerCase())
    )
  }
}
