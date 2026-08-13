import { describe, expect, it } from 'vitest'
import type { RootState } from '../store'
import { catalogApi } from './catalog-api'
import { createCartInitialState, selectSessionId } from './cart-slice'
import { uiSlice } from './ui-slice'

function buildRootState(sessionId: string): RootState {
  return {
    cart: createCartInitialState(sessionId),
    ui: uiSlice.reducer(undefined, { type: 'test/init' }),
    [catalogApi.reducerPath]: catalogApi.reducer(undefined, { type: 'test/init' }),
  }
}

describe('cart slice', () => {
  it('stores only the session id, with no duplicated cart count', () => {
    const state = createCartInitialState('session-123')
    expect(state).toEqual({ sessionId: 'session-123' })
  })

  it('selectSessionId reads the session id from the root state', () => {
    expect(selectSessionId(buildRootState('session-123'))).toBe('session-123')
  })
})
