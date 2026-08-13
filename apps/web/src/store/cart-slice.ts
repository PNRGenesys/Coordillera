import { createSlice } from '@reduxjs/toolkit'
import type { RootState } from '../store'

export type CartState = { sessionId: string }

export function createCartInitialState(sessionId: string): CartState {
  return { sessionId }
}

export const cartSlice = createSlice({
  name: 'cart',
  initialState: createCartInitialState(''),
  reducers: {},
})

export function selectSessionId(state: RootState): string {
  return state.cart.sessionId
}
