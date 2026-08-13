import { configureStore, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { catalogApi } from './store/catalog-api'

type CartState = { itemCount: number }

const cartSlice = createSlice({
  name: 'cart',
  initialState: { itemCount: 0 } satisfies CartState,
  reducers: {
    setItemCount: (state, action: PayloadAction<number>) => {
      state.itemCount = action.payload
    },
  },
})

export const { setItemCount } = cartSlice.actions
export const store = configureStore({
  reducer: { cart: cartSlice.reducer, [catalogApi.reducerPath]: catalogApi.reducer },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(catalogApi.middleware),
})

export type RootState = ReturnType<typeof store.getState>
