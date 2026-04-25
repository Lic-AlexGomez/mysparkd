export interface TrelloMember {
  id: string
  username: string
  fullName: string
  url?: string
}

export interface TrelloBoard {
  id: string
  name: string
  url: string
  closed: boolean
}

export interface TrelloCard {
  id: string
  name: string
  desc?: string
  due?: string | null
  url: string
  idList: string
  closed: boolean
}

export interface TrelloList {
  id: string
  name: string
  closed: boolean
}

async function trelloRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/trello/${path}`, init)
  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || "Trello request failed")
  }
  return (await response.json()) as T
}

export const trelloService = {
  getMe: () => trelloRequest<TrelloMember>("members/me"),
  getMyBoards: () => trelloRequest<TrelloBoard[]>("members/me/boards"),
  getBoardLists: (boardId: string) => trelloRequest<TrelloList[]>(`boards/${boardId}/lists`),
  getBoardCards: (boardId: string) => trelloRequest<TrelloCard[]>(`boards/${boardId}/cards`),
}

