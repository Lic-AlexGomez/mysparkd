import Link from "next/link"

export function parseTextWithLinks(text: string) {
  const parts: React.ReactNode[] = []
  const regex = /(#\w+)|(@\w+)|(https?:\/\/[^\s]+)/g
  let lastIndex = 0
  let match

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index))
    }

    const matched = match[0]
    if (matched.startsWith('#')) {
      const hashtag = matched.substring(1)
      parts.push(
        <Link
          key={match.index}
          href={`/search?q=${encodeURIComponent(hashtag)}&type=hashtag`}
          className="text-primary hover:underline font-semibold"
        >
          {matched}
        </Link>
      )
    } else if (matched.startsWith('@')) {
      const username = matched.substring(1)
      parts.push(
        <Link
          key={match.index}
          href={`/search?q=${encodeURIComponent(username)}&type=user`}
          className="text-secondary hover:underline font-semibold"
        >
          {matched}
        </Link>
      )
    } else {
      parts.push(
        <a
          key={match.index}
          href={matched}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent hover:underline"
        >
          {matched}
        </a>
      )
    }

    lastIndex = regex.lastIndex
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex))
  }

  return parts
}

export function extractHashtags(text: string): string[] {
  const regex = /#(\w+)/g
  const hashtags: string[] = []
  let match

  while ((match = regex.exec(text)) !== null) {
    hashtags.push(match[1])
  }

  return hashtags
}

export function extractMentions(text: string): string[] {
  const regex = /@(\w+)/g
  const mentions: string[] = []
  let match

  while ((match = regex.exec(text)) !== null) {
    mentions.push(match[1])
  }

  return mentions
}
