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

export interface TrelloLabel {
  id: string
  name: string
  color: string | null
}

export interface TrelloCard {
  id: string
  name: string
  desc?: string
  due?: string | null
  url: string
  idList: string
  idLabels: string[]
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

const json = (body: unknown) => ({
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body),
})

const jsonPut = (body: unknown) => ({
  method: "PUT",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body),
})

export const trelloService = {
  getMe: () => trelloRequest<TrelloMember>("members/me"),
  getMyBoards: () => trelloRequest<TrelloBoard[]>("members/me/boards"),
  getBoardLists: (boardId: string) => trelloRequest<TrelloList[]>(`boards/${boardId}/lists`),
  getBoardCards: (boardId: string) => trelloRequest<TrelloCard[]>(`boards/${boardId}/cards`),
  getBoardLabels: (boardId: string) => trelloRequest<TrelloLabel[]>(`boards/${boardId}/labels`),

  createCard: (idList: string, name: string, desc?: string, due?: string, idLabels?: string[]) =>
    trelloRequest<TrelloCard>(`cards`, json({ idList, name, desc, due, idLabels })),

  updateCard: (cardId: string, fields: { name?: string; desc?: string; due?: string | null; idList?: string; closed?: boolean }) =>
    trelloRequest<TrelloCard>(`cards/${cardId}`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(fields) }),

  archiveCard: (cardId: string) =>
    trelloRequest<TrelloCard>(`cards/${cardId}`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ closed: true }) }),

  moveCard: (cardId: string, idList: string) =>
    trelloRequest<TrelloCard>(`cards/${cardId}`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ idList }) }),

  createList: (boardId: string, name: string) =>
    trelloRequest<TrelloList>(`lists`, json({ idBoard: boardId, name })),
}

