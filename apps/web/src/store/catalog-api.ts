import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export type CatalogProduct = {
  id: string
  variantId: string
  name: string
  slug: string
  description: string | undefined
  priceCents: number
  sku: string
  color: string | undefined
  size: string | undefined
}

export const catalogApi = createApi({
  reducerPath: 'catalogApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/' }),
  tagTypes: ['Cart'],
  endpoints: (build) => ({
    getProducts: build.query<ReadonlyArray<CatalogProduct>, void>({
      query: () => 'products',
    }),
    addCartItem: build.mutation<{ cartId: string }, { sessionId: string; variantId: string; quantity: number }>({
      query: (body) => ({ url: 'cart/items', method: 'POST', body }),
      invalidatesTags: ['Cart'],
    }),
  }),
})

export const { useAddCartItemMutation, useGetProductsQuery } = catalogApi
