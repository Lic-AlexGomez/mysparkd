declare module 'sockjs-client' {
  export default class SockJS {
    constructor(url: string, _reserved?: any, options?: any)
    close(): void
    send(data: string): void
    onopen: ((e: Event) => void) | null
    onmessage: ((e: MessageEvent) => void) | null
    onclose: ((e: CloseEvent) => void) | null
    onerror: ((e: Event) => void) | null
    readyState: number
  }
}
