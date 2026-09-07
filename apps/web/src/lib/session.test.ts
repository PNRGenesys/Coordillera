import { beforeEach, describe, expect, it } from 'vitest'
import { getOrCreateSessionId } from './session'

const SESSION_STORAGE_KEY = 'cordillera-cart-session'

describe('getOrCreateSessionId', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('creates and persists a new session id when none exists', () => {
    const sessionId = getOrCreateSessionId()
    expect(sessionId).toMatch(/^[0-9a-f-]{36}$/)
    expect(window.localStorage.getItem(SESSION_STORAGE_KEY)).toBe(sessionId)
  })

  it('reuses the session id already stored in localStorage', () => {
    window.localStorage.setItem(SESSION_STORAGE_KEY, 'existing-session-id')
    expect(getOrCreateSessionId()).toBe('existing-session-id')
  })
})
