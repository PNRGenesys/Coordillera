const SESSION_STORAGE_KEY = 'coordillera-cart-session'

export function getOrCreateSessionId(): string {
  const existing = window.localStorage.getItem(SESSION_STORAGE_KEY)
  if (existing) return existing
  const sessionId = crypto.randomUUID()
  window.localStorage.setItem(SESSION_STORAGE_KEY, sessionId)
  return sessionId
}
