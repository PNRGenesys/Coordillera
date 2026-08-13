import { configureStore } from '@reduxjs/toolkit'
import { cartSlice, createCartInitialState } from './store/cart-slice'
import { catalogApi } from './store/catalog-api'
import { uiSlice } from './store/ui-slice'
import { getOrCreateSessionId } from './lib/session'

export const store = configureStore({
  reducer: { cart: cartSlice.reducer, ui: uiSlice.reducer, [catalogApi.reducerPath]: catalogApi.reducer },
  preloadedState: { cart: createCartInitialState(getOrCreateSessionId()) },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(catalogApi.middleware),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
